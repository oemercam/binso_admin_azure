// Apply only after capacity, registry identity and exact-image qualification approval.
param appName string
@description('Qualified private ACR image, including @sha256 digest; never a floating tag.')
param scannerImage string
param registryPullIdentityClientId string

resource app 'Microsoft.Web/sites@2024-04-01' existing = {
  name: appName
}
resource scanner 'Microsoft.Web/sites/sitecontainers@2024-04-01' = {
  parent: app
  name: 'binso-scanner'
  properties: {
    image: scannerImage
    isMain: false
    authType: 'UserAssigned'
    userManagedIdentityClientId: registryPullIdentityClientId
    targetPort: '3310'
    environmentVariables: []
    volumeMounts: [
      {
        containerMountPath: '/var/lib/clamav'
        volumeSubPath: '/binso-scanner/signatures'
        readOnly: false
      }
    ]
  }
}
