FROM jenkins/jenkins:lts
USER root
# Node 22: @supabase/supabase-js lo exige
RUN apt-get update \
 && apt-get install -y --no-install-recommends curl ca-certificates \
 && curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
 && apt-get install -y --no-install-recommends nodejs \
 && rm -rf /var/lib/apt/lists/*
# Docker CLI + buildx: usa el Docker del host via docker.sock
COPY --from=docker:cli /usr/local/bin/docker /usr/local/bin/docker
COPY --from=docker:cli /usr/local/libexec/docker/cli-plugins /usr/local/libexec/docker/cli-plugins
USER jenkins
RUN jenkins-plugin-cli --plugins workflow-aggregator git credentials-binding sonar timestamper junit pipeline-stage-view
