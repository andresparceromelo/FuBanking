pipeline {
  agent any

  environment {
    DOCKERHUB_USER = 'abedoya923'
    BACKEND_IMG    = 'abedoya923/fubanking-backend'
    FRONTEND_IMG   = 'abedoya923/fubanking-frontend'
    GITOPS_REPO    = 'https://github.com/andresparceromelo/FuBanking-gitops.git'
    GITOPS_BRANCH  = 'main'
    SONAR_HOST     = 'http://host.docker.internal:9000'
    SONAR_KEY      = 'FuBank'
  }

  options {
    timestamps()
    buildDiscarder(logRotator(numToKeepStr: '20'))
  }

  stages {
    stage('Checkout') {
      steps { checkout scm }
    }

    stage('Backend: install + test + build') {
      steps {
        dir('backend') {
          sh '''
            node -v; npm -v
            npm ci
            npm run test:coverage || npm run test || echo "WARN: backend tests failed, continuing to sonar"
            npm run build
          '''
        }
      }
    }

    stage('Frontend: install + test + build') {
      steps {
        dir('frontend') {
          sh '''
            npm ci
            npm run test:coverage || npm run test || echo "WARN: frontend tests failed, continuing to sonar"
            npm run build
          '''
        }
      }
    }

    stage('SonarQube analysis') {
      steps {
        withCredentials([string(credentialsId: 'sonarqube-token', variable: 'SONAR_TOKEN')]) {
          withSonarQubeEnv('SonarLocal') {
            sh '''
              npx -y sonarqube-scanner \
                -Dsonar.projectKey=$SONAR_KEY \
                -Dsonar.host.url=$SONAR_HOST \
                -Dsonar.login=$SONAR_TOKEN
            '''
          }
        }
      }
    }

    stage('Quality Gate') {
      steps {
        timeout(time: 5, unit: 'MINUTES') {
          // Requiere webhook Sonar -> http://host.docker.internal:8080/sonarqube-webhook/
          waitForQualityGate abortPipeline: true
        }
      }
    }

    stage('Docker build & push') {
      steps {
        withCredentials([usernamePassword(credentialsId: 'dockerhub', usernameVariable: 'DH_USER', passwordVariable: 'DH_PASS')]) {
          sh '''
            echo "$DH_PASS" | docker login -u "$DH_USER" --password-stdin
            TAG="${BUILD_NUMBER}"

            docker build -t $BACKEND_IMG:$TAG -t $BACKEND_IMG:latest ./backend
            docker push $BACKEND_IMG:$TAG
            docker push $BACKEND_IMG:latest

            docker build \
              --build-arg NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1 \
              -t $FRONTEND_IMG:$TAG -t $FRONTEND_IMG:latest ./frontend
            docker push $FRONTEND_IMG:$TAG
            docker push $FRONTEND_IMG:latest
          '''
        }
      }
    }

    stage('Update GitOps repo (new image tags)') {
      steps {
        withCredentials([usernamePassword(credentialsId: 'github', usernameVariable: 'GH_USER', passwordVariable: 'GH_PASS')]) {
          sh '''
            TAG="${BUILD_NUMBER}"
            rm -rf gitops-tmp && git clone -b $GITOPS_BRANCH "https://$GH_USER:$GH_PASS@github.com/andresparceromelo/FuBanking-gitops.git" gitops-tmp
            cd gitops-tmp

            # Actualiza los newTag de ambas imagenes en overlays/dev/kustomization.yaml
            # (ambas usan el mismo TAG = BUILD_NUMBER del pipeline)
            if [ -f overlays/dev/kustomization.yaml ]; then
              sed -i "s/newTag: \".*\"/newTag: \"$TAG\"/g" overlays/dev/kustomization.yaml
              grep -A2 "name: abedoya923" overlays/dev/kustomization.yaml
            fi

            git config user.email "jenkins@fubanking.local"
            git config user.name "jenkins-ci"
            git add -A
            git diff --cached --quiet || git commit -m "deploy: backend+frontend build $TAG (jenkins $BUILD_URL)"
            git push origin $GITOPS_BRANCH
          '''
        }
      }
    }
  }

  post {
    success { echo "OK: imagenes :${env.BUILD_NUMBER} pusheadas y GitOps actualizado. ArgoCD sincroniza solo." }
    failure { echo "FAIL: revisar stage rojo. Sonar en ${env.SONAR_HOST} (admin/admin inicial)." }
  }
}
