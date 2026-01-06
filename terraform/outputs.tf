output "container_app_url" {
  description = "The URL of the Saheli backend Container App"
  value       = "https://${azurerm_container_app.saheli_backend.ingress[0].fqdn}"
}

output "container_app_name" {
  description = "The name of the Container App"
  value       = azurerm_container_app.saheli_backend.name
}

output "acr_name" {
  description = "The name of the Azure Container Registry"
  value       = data.azurerm_container_registry.acr.name
}

output "acr_login_server" {
  description = "The login server URL of the Azure Container Registry"
  value       = data.azurerm_container_registry.acr.login_server
}

