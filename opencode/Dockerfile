FROM ghcr.io/anomalyco/opencode:latest

USER root

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

USER opencode

RUN opencode plugins add opencode-browser-plugin
RUN npx playwright install chromium

COPY --chown=opencode:opencode opencode.json /home/opencode/.config/opencode/opencode.json

EXPOSE 4096

ENV OPENCODE_SERVER_PASSWORD=""
ENV OPENCODE_SERVER_USERNAME=opencode

CMD ["opencode", "serve", "--port", "4096", "--hostname", "0.0.0.0"]
