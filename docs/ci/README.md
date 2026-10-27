# CI FuBanking

Pipeline real: `/Jenkinsfile` (raíz) — install → test → sonar → qualityGate → docker → smoke (`/health` + `/`) → push → GitOps externo (`FuBanking-gitops`, bump `newTag`).

`ci/jenkins.Dockerfile`: imagen del agente Jenkins con Node.js y plugins.
No hay `k8s/` en este repo: el deploy vive en `FuBanking-gitops`.
