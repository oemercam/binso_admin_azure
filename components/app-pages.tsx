"use client";

// Compatibility exports. Routes import their domain module directly.
export { DashboardPage } from "./pages/dashboard";
export { FinanceAnalysisPage, OffersPage, InvoicesPage, FinancePage, DocumentsHubPage } from "./pages/finance";
export { CustomersPage, CustomerDetail, CustomerForm } from "./pages/customers";
export { PaymentsPage, PaymentForm, PaymentDetail } from "./pages/payments";
export { ProductsPage, ProductForm } from "./pages/products";
export { EmployeesPage, EmployeeForm } from "./pages/employees";
export { ExpensesPage, ExpenseForm } from "./pages/expenses";
export { TimePage } from "./pages/time";
export { SupportPage, SupportTicketForm, SupportChat } from "./pages/support";
export { SettingsPage, AccountSettingsPage, CompanySettingsPage, SubscriptionSettingsPage, NotificationSettingsPage, LanguageSettingsPage, AppearanceSettingsPage } from "./pages/settings";
export { NotificationsPage } from "./pages/notifications";
export { InvoiceEditor, OfferEditor } from "./documents";
