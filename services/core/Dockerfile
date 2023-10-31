FROM denoland/deno:1.37.0

EXPOSE 8000

WORKDIR /app

USER deno

COPY . .

RUN deno cache main.ts

CMD ["run", "--allow-net", "main.ts"]
