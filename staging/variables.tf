variable "access_token" {
  description = "An acceess token for login to GCP"
  type        = string
  default     = null
}

variable "project" {
  description = "A name of a GCP project"
  type        = string
  default     = null
}

variable "project_id" {
  description = "A project id of a GCP project"
  type        = string
  default     = null
}

variable "repo_name" {
  description = "github repository name"
  default     = "pulsate-dev/pulsate"
}

variable "location" {
  description = "A location of using service"
  type        = string
  default     = "asia-northeast1"
}

variable "zone" {
  description = "A zone of a GKE cluster"
  type        = string
  default     = "asia-northeast1-a"
}

variable "container_images" {
  description = "docker container images"
  type = list(object({
    name  = string
    image = string
  }))
  default = []
}

variable "gke_num_nodes" {
  description = "Total node count on GKE pool"
  type        = number
  default     = 1
}
