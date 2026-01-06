terraform {
  required_version = ">= 1.0"
  
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.111.0"
    }
    time = {
      source  = "hashicorp/time"
      version = "~> 0.9"
    }
  }
}

provider "azurerm" {
  features {}
}

# Data sources for existing resources
data "azurerm_resource_group" "main" {
  name = "rg-wanderon"
}

data "azurerm_key_vault" "kv" {
  name                = "wanderon-kv"
  resource_group_name = data.azurerm_resource_group.main.name
}

data "azurerm_client_config" "current" {}

# Get all secrets from Key Vault
data "azurerm_key_vault_secret" "mongo_uri_saheli" {
  name         = "MONGO-URI-SAHELI"
  key_vault_id = data.azurerm_key_vault.kv.id
}

data "azurerm_key_vault_secret" "port_saheli" {
  name         = "PORT-SAHELI"
  key_vault_id = data.azurerm_key_vault.kv.id
}

data "azurerm_key_vault_secret" "jwt_secret_saheli" {
  name         = "JWT-SECRET-SAHELI"
  key_vault_id = data.azurerm_key_vault.kv.id
}

data "azurerm_key_vault_secret" "whatsapp_token" {
  name         = "WHATSAPP-ACCESS-TOKEN"
  key_vault_id = data.azurerm_key_vault.kv.id
}

data "azurerm_key_vault_secret" "whatsapp_phone_id" {
  name         = "WHATSAPP-PHONE-NUMBER-ID"
  key_vault_id = data.azurerm_key_vault.kv.id
}

# ============================================================================
# AZURE CONTAINER REGISTRY (ACR) - Using data source since ACR already exists
# ============================================================================

data "azurerm_container_registry" "acr" {
  name                = "acrwanderon"
  resource_group_name = data.azurerm_resource_group.main.name
}

# ============================================================================
# CONTAINER APP ENVIRONMENT (Reuse existing or create new)
# ============================================================================

data "azurerm_container_app_environment" "env" {
  name                = "wanderon-env"
  resource_group_name = data.azurerm_resource_group.main.name
}

# ============================================================================
# MANAGED IDENTITY
# ============================================================================

resource "azurerm_user_assigned_identity" "saheli_identity" {
  name                = "saheli-backend-identity"
  location            = data.azurerm_resource_group.main.location
  resource_group_name = data.azurerm_resource_group.main.name

  tags = {
    environment = "production"
    project     = "saheli-2.0"
  }
}

# ============================================================================
# ROLE ASSIGNMENTS
# ============================================================================

# ACR Pull Role
resource "azurerm_role_assignment" "saheli_acr_pull" {
  scope                = data.azurerm_container_registry.acr.id
  role_definition_name = "AcrPull"
  principal_id         = azurerm_user_assigned_identity.saheli_identity.principal_id
}

# Key Vault Access
resource "azurerm_role_assignment" "saheli_keyvault" {
  scope                = data.azurerm_key_vault.kv.id
  role_definition_name = "Key Vault Secrets User"
  principal_id         = azurerm_user_assigned_identity.saheli_identity.principal_id
}

# Key Vault Access Policy
resource "azurerm_key_vault_access_policy" "saheli_kv_policy" {
  key_vault_id = data.azurerm_key_vault.kv.id
  tenant_id    = data.azurerm_client_config.current.tenant_id
  object_id    = azurerm_user_assigned_identity.saheli_identity.principal_id

  secret_permissions = ["Get", "List"]
}

# ============================================================================
# WAIT FOR RBAC PROPAGATION
# ============================================================================

resource "time_sleep" "wait_for_rbac" {
  depends_on = [
    azurerm_role_assignment.saheli_acr_pull,
    azurerm_role_assignment.saheli_keyvault,
    azurerm_key_vault_access_policy.saheli_kv_policy
  ]

  create_duration = "150s"  # 2.5 minutes wait for RBAC propagation
}

# ============================================================================
# CONTAINER APP
# ============================================================================

resource "azurerm_container_app" "saheli_backend" {
  name                         = "saheli-backend"
  container_app_environment_id = data.azurerm_container_app_environment.env.id
  resource_group_name          = data.azurerm_resource_group.main.name
  revision_mode                = "Single"

  identity {
    type = "UserAssigned"
    identity_ids = [azurerm_user_assigned_identity.saheli_identity.id]
  }

  registry {
    identity = azurerm_user_assigned_identity.saheli_identity.id
    server   = data.azurerm_container_registry.acr.login_server
  }

  ingress {
    external_enabled = true
    target_port      = 4000
    transport        = "auto"
    traffic_weight {
      latest_revision = true
      percentage      = 100
    }
  }

  template {
    min_replicas = 1
    max_replicas = 3

    container {
      name   = "saheli-backend"
      image  = "${data.azurerm_container_registry.acr.login_server}/saheli-backend:latest"
      cpu    = 0.5
      memory = "1.0Gi"

      env {
        name  = "PORT_SAHELI"
        secret_name = "port-saheli"
      }
      env {
        name  = "MONGO_URI_SAHELI"
        secret_name = "mongo-uri-saheli"
      }
      env {
        name  = "JWT_SECRET_SAHELI"
        secret_name = "jwt-secret-saheli"
      }
      env {
        name  = "WHATSAPP_ACCESS_TOKEN"
        secret_name = "whatsapp-access-token"
      }
      env {
        name  = "WHATSAPP_PHONE_NUMBER_ID"
        secret_name = "whatsapp-phone-number-id"
      }
    }
  }

  secret {
    name  = "port-saheli"
    value = data.azurerm_key_vault_secret.port_saheli.value
  }

  secret {
    name  = "mongo-uri-saheli"
    value = data.azurerm_key_vault_secret.mongo_uri_saheli.value
  }

  secret {
    name  = "jwt-secret-saheli"
    value = data.azurerm_key_vault_secret.jwt_secret_saheli.value
  }

  secret {
    name  = "whatsapp-access-token"
    value = data.azurerm_key_vault_secret.whatsapp_token.value
  }

  secret {
    name  = "whatsapp-phone-number-id"
    value = data.azurerm_key_vault_secret.whatsapp_phone_id.value
  }

  depends_on = [
    azurerm_user_assigned_identity.saheli_identity,
    azurerm_role_assignment.saheli_acr_pull,
    azurerm_role_assignment.saheli_keyvault,
    azurerm_key_vault_access_policy.saheli_kv_policy,
    time_sleep.wait_for_rbac
  ]

  lifecycle {
    ignore_changes = [template[0].container[0].image]
  }

  tags = {
    environment = "production"
    project     = "saheli-2.0"
  }
}

