@description('Azure region')
param location string = resourceGroup().location
param appName string = 'binso-one'
param environment string = 'prod'
param appUrl string = 'https://www.binso.ch'
param enablePostgresHa bool = false
param postgresBackupRetentionDays int = 14
@secure()
param postgresAdminPassword string

var prefix='${appName}-${environment}'
var dbName='binso'
var postgresAdmin='binsoadmin'
var storageName=toLower(replace('${appName}${environment}${uniqueString(resourceGroup().id)}','-',''))

resource log 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name:'${prefix}-log'
  location:location
  properties:{retentionInDays:30}
}
resource insights 'Microsoft.Insights/components@2020-02-02' = {
  name:'${prefix}-appi'
  location:location
  kind:'web'
  properties:{Application_Type:'web',WorkspaceResourceId:log.id}
}

resource vnet 'Microsoft.Network/virtualNetworks@2024-01-01' = {
  name:'${prefix}-vnet'
  location:location
  properties:{
    addressSpace:{addressPrefixes:['10.42.0.0/16']}
    subnets:[
      {name:'app';properties:{addressPrefix:'10.42.1.0/24';serviceEndpoints:[{service:'Microsoft.Storage'}];delegations:[{name:'web';properties:{serviceName:'Microsoft.Web/serverFarms'}}]}}
      {name:'postgres';properties:{addressPrefix:'10.42.2.0/24';delegations:[{name:'postgres';properties:{serviceName:'Microsoft.DBforPostgreSQL/flexibleServers'}}]}}
    ]
  }
}
resource appSubnet 'Microsoft.Network/virtualNetworks/subnets@2024-01-01' existing = {parent:vnet name:'app'}
resource pgSubnet 'Microsoft.Network/virtualNetworks/subnets@2024-01-01' existing = {parent:vnet name:'postgres'}
resource privateDns 'Microsoft.Network/privateDnsZones@2024-06-01' = {name:'${prefix}.private.postgres.database.azure.com' location:'global'}
resource dnsLink 'Microsoft.Network/privateDnsZones/virtualNetworkLinks@2024-06-01' = {parent:privateDns name:'${prefix}-vnet-link' location:'global' properties:{virtualNetwork:{id:vnet.id} registrationEnabled:false}}

resource plan 'Microsoft.Web/serverfarms@2023-12-01' = {
  name:'${prefix}-plan'
  location:location
  sku:{name:'P0v3',tier:'PremiumV3',capacity:1}
  kind:'linux'
  properties:{reserved:true}
}
resource web 'Microsoft.Web/sites@2023-12-01' = {
  name:'${prefix}-web'
  location:location
  identity:{type:'SystemAssigned'}
  properties:{
    serverFarmId:plan.id
    httpsOnly:true
    clientAffinityEnabled:false
    virtualNetworkSubnetId:appSubnet.id
    siteConfig:{
      linuxFxVersion:'NODE|24-lts'
      appCommandLine:'node server.js'
      alwaysOn:true
      ftpsState:'Disabled'
      minTlsVersion:'1.2'
      http20Enabled:true
      healthCheckPath:'/api/health'
      vnetRouteAllEnabled:true
      appSettings:[
        {name:'NODE_ENV',value:'production'}
        {name:'APP_MODE',value:'production'}
        {name:'NEXT_PUBLIC_APP_MODE',value:'production'}
        {name:'APP_URL',value:appUrl}
        {name:'NEXT_PUBLIC_SITE_URL',value:appUrl}
        {name:'DATABASE_SSL',value:'true'}
        {name:'DATABASE_SSL_REJECT_UNAUTHORIZED',value:'true'}
        {name:'AZURE_STORAGE_ACCOUNT',value:storageName}
        {name:'AZURE_STORAGE_CONTAINER',value:'documents'}
        {name:'APPLICATIONINSIGHTS_CONNECTION_STRING',value:insights.properties.ConnectionString}
        {name:'WEBSITE_HEALTHCHECK_MAXPINGFAILURES',value:'3'}
      ]
    }
  }
}

resource postgres 'Microsoft.DBforPostgreSQL/flexibleServers@2024-08-01' = {
  name:'${prefix}-pg'
  location:location
  sku:{name:'Standard_D2ds_v5',tier:'GeneralPurpose'}
  dependsOn:[dnsLink]
  properties:{
    administratorLogin:postgresAdmin
    administratorLoginPassword:postgresAdminPassword
    version:'16'
    network:{delegatedSubnetResourceId:pgSubnet.id privateDnsZoneArmResourceId:privateDns.id publicNetworkAccess:'Disabled'}
    storage:{storageSizeGB:128}
    backup:{backupRetentionDays:postgresBackupRetentionDays,geoRedundantBackup:'Disabled'}
    highAvailability:enablePostgresHa?{mode:'ZoneRedundant'}:{mode:'Disabled'}
  }
}
resource database 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2024-08-01' = {parent:postgres name:dbName}

resource storage 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  name:storageName
  location:location
  sku:{name:'Standard_LRS'}
  kind:'StorageV2'
  properties:{allowBlobPublicAccess:false minimumTlsVersion:'TLS1_2' supportsHttpsTrafficOnly:true publicNetworkAccess:'Enabled' networkAcls:{bypass:'AzureServices' defaultAction:'Deny' virtualNetworkRules:[{id:appSubnet.id action:'Allow'}]}}
}
resource blobService 'Microsoft.Storage/storageAccounts/blobServices@2023-05-01' = {
  parent:storage
  name:'default'
  properties:{
    isVersioningEnabled:true
    deleteRetentionPolicy:{enabled:true days:14}
    containerDeleteRetentionPolicy:{enabled:true days:14}
  }
}
resource documents 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-05-01' = {parent:blobService name:'documents' properties:{publicAccess:'None'}}

// The Web App accesses Blob Storage through its managed identity; no account key is required.
resource storageBlobContributor 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  scope:storage
  name:guid(storage.id,web.id,'blob-data-contributor')
  properties:{
    principalId:web.identity.principalId
    principalType:'ServicePrincipal'
    roleDefinitionId:subscriptionResourceId('Microsoft.Authorization/roleDefinitions','ba92f5b4-2d11-453d-a403-e96b0029c9fe')
  }
}



resource autoscale 'Microsoft.Insights/autoscalesettings@2022-10-01' = {
  name:'${prefix}-autoscale'
  location:location
  properties:{
    enabled:true
    targetResourceUri:plan.id
    profiles:[{
      name:'default'
      capacity:{minimum:'1' maximum:'3' default:'1'}
      rules:[
        {
          metricTrigger:{metricName:'CpuPercentage' metricResourceUri:plan.id operator:'GreaterThan' statistic:'Average' threshold:70 timeAggregation:'Average' timeGrain:'PT1M' timeWindow:'PT5M'}
          scaleAction:{direction:'Increase' type:'ChangeCount' value:'1' cooldown:'PT5M'}
        }
        {
          metricTrigger:{metricName:'CpuPercentage' metricResourceUri:plan.id operator:'LessThan' statistic:'Average' threshold:30 timeAggregation:'Average' timeGrain:'PT1M' timeWindow:'PT10M'}
          scaleAction:{direction:'Decrease' type:'ChangeCount' value:'1' cooldown:'PT10M'}
        }
      ]
    }]
  }
}

output webAppName string = web.name
output postgresHost string = postgres.properties.fullyQualifiedDomainName
output storageAccount string = storage.name
output appServicePrincipalId string = web.identity.principalId
