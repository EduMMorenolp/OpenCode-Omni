FROM ghcr.io/anomalyco/opencode:latest

RUN apk add --no-cache ca-certificates curl

RUN opencode plugin opencode-browser-plugin 2>/dev/null || true
RUN npx playwright install chromium --with-deps 2>/dev/null || true

COPY opencode.json /root/.config/opencode/opencode.json

EXPOSE 4096

ENV OPENCODE_SERVER_PASSWORD=""
ENV OPENCODE_SERVER_USERNAME=opencode

CMD ["serve", "--port", "4096", "--hostname", "0.0.0.0", "--print-logs"]
