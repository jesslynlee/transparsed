import axios from "axios"

const api = axios.create({
  baseURL: "/api",
})

export async function getCategories() {
  const { data } = await api.get("/categories")
  return data
}

export async function createCategory(name, color) {
  const { data } = await api.post("/categories", { name, color })
  return data
}

export async function deleteCategory(categoryId) {
  await api.delete(`/categories/${categoryId}`)
}

export async function getAccounts() {
  const { data } = await api.get("/accounts")
  return data
}

export async function createAccount(account) {
  const { data } = await api.post("/accounts", account)
  return data
}

export async function getUploads() {
  const { data } = await api.get("/uploads")
  return data
}

export async function uploadStatement(file) {
  const formData = new FormData()
  formData.append("file", file)
  const { data } = await api.post("/upload", formData)
  return data
}

export async function createTransaction(txn) {
  const { data } = await api.post("/transactions", txn)
  return data
}

export async function getTransactions(params = {}) {
  const { data } = await api.get("/transactions", { params })
  return data
}

export async function updateTransaction(id, fields) {
  const { data } = await api.put(`/transactions/${id}`, fields)
  return data
}

export async function deleteTransaction(id) {
  await api.delete(`/transactions/${id}`)
}

export async function commitTransactions(transactionIds) {
  const { data } = await api.post("/transactions/commit", { transaction_ids: transactionIds })
  return data
}

export async function bulkUpdateTransactions(updates) {
  const { data } = await api.post("/transactions/bulk-update", { updates })
  return data
}

export async function deleteUpload(uploadId) {
  const { data } = await api.delete(`/uploads/${uploadId}`)
  return data
}

export async function getCategoryKeywords() {
  const { data } = await api.get("/category-keywords")
  return data
}

export async function addCategoryKeyword(category, keyword) {
  const { data } = await api.post("/category-keywords", { category, keyword })
  return data
}

export async function getKeywordsWithIds() {
  const { data } = await api.get("/category-keywords/all")
  return data
}

export async function deleteCategoryKeyword(keywordId) {
  await api.delete(`/category-keywords/${keywordId}`)
}

export async function getDashboardSummary(filters = {}) {
  const { data } = await api.get("/dashboard/summary", { params: filters })
  return data
}

export async function getDashboardByCategory(filters = {}) {
  const { data } = await api.get("/dashboard/by-category", { params: filters })
  return data
}

export async function getDashboardTrends(filters = {}) {
  const { data } = await api.get("/dashboard/trends", { params: filters })
  return data
}

export async function getDashboardTopCategories(filters = {}) {
  const { data } = await api.get("/dashboard/top-categories", { params: filters })
  return data
}

export async function getDashboardTopMerchants(filters = {}) {
  const { data } = await api.get("/dashboard/top-merchants", { params: filters })
  return data
}

export default api
