// EnCarAPI Node.js quickstart. Get a key at https://encarapi.com
const { EnCarAPI } = require("../src/index.js");

(async () => {
  const client = new EnCarAPI(process.env.ENCARAPI_KEY); // required

  const catalog = await client.catalog({ count: true });
  console.log("catalog:", JSON.stringify(catalog).slice(0, 200));

  const facets = await client.nav();
  console.log("facets:", JSON.stringify(facets).slice(0, 200));

  // const detail = await client.vehicle("12345678");
  // console.log(detail);
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
