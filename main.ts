import nhttp from "nhttp";

if (import.meta.main) {
  const app = nhttp();

  app.get("/", () => "Hello, World");

  app.listen(8000, (err, info) => {
    if (err) {
      throw err;
    }
    console.log(`Running on port http://${info.hostname}:${info.port}`);
  });
}
