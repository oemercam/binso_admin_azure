export type ContractPartyRole =
  | 'end_customer'
  | 'prime_contractor'
  | 'contracting_customer'
  | 'service_provider'
  | 'subcontractor'

export type ContractParty = {
  id: string
  name: string
  role: ContractPartyRole
}

export type ContractChain = {
  id: string
  label: string
  parties: ContractParty[]
  mandateReference?: string
  procurementReference?: string
}

export type ApprovalPolicy = {
  requireTimeApproval: boolean
  requireEvidenceBeforeApproval: boolean
  requireEvidenceBeforeBilling: boolean
  invoiceApprovalThreshold?: number
  supplierInvoiceApprovalThreshold?: number
}
