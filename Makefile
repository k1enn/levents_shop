# make up: build, stage, create + seed the whole stack. make down: delete it.
# Needs AWS creds and TF_VAR_* (from infra/app/.env locally, GitHub secrets in CI).
APP := infra/app
-include $(APP)/.env
export

.PHONY: up down url init

init:
	cd $(APP) && terraform init -input=false -reconfigure -backend-config="bucket=phoneshop-tfstate-$$(aws sts get-caller-identity --query Account --output text)"

up: init
	cd web && npm ci && npm run build && sh scripts/stage-lambda.sh
	cd $(APP) && terraform apply -auto-approve -input=false

# archive_file needs the dir to exist even on destroy.
down: init
	mkdir -p $(APP)/.lambda
	cd $(APP) && terraform destroy -auto-approve -input=false

url:
	@cd $(APP) && terraform output -raw url
