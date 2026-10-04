// EnCarAPI Node.js quickstart. Get a key at https://encarapi.com
const { EnCarAPI } = require("../src/index.js");

(async () => {
  const client = new EnCarAPI(process.env.ENCARAPI_KEY); // required

  // Korean catalog (Encar by default), English values, with total count
  const kr = await client.korea.catalog({ manufacturer: "Hyundai", lang: "en", limit: 5, count: true });
  console.log("Korea:", kr.Count, "matches, first:", kr.SearchResults[0]?.Id);

  // All three Korean marketplaces, deduplicated (plan-dependent, see encarapi.com/#pricing)
  // const all = await client.korea.catalog({ source: "all", limit: 5, count: true });

  // Full detail for one vehicle (Encar id, "kbc:<id>" or "kcar:<id>")
  // const car = await client.korea.vehicle("12345678");

  // Chinese listings (ChinaCarAPI key or EnCarAPI key with the China add-on)
  // const cn = await client.china.catalog({ make: "BYD", limit: 5 });
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
