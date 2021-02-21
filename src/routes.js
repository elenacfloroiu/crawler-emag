const Apify = require("apify");
const {
  utils: { log },
} = Apify;

let output = [];

exports.CATEGORY = async ({ $, request }, { requestQueue }) => {
  return Apify.utils.enqueueLinks({
    $,
    requestQueue,
    selector: "div.card-heading > a",
    baseUrl: request.loadedUrl,
    transformRequestFunction: (req) => {
      req.userData.label = "DETAIL";
      return req;
    },
  });
};

// Getting the link of the next page
exports.NEXT_PAGE = async ({ $, request }, { requestQueue }) => {
  return Apify.utils.enqueueLinks({
    $,
    requestQueue,
    selector: "#listing-paginator > li:nth-child(5) > a",
    baseUrl: request.loadedUrl,
    transformRequestFunction: (req) => {
      req.userData.detailPage = false;
      return req;
    },
  });
};

exports.DETAIL = async ({ $, request }) => {
  log.debug("Scraping results.");
  const priceItem = $(".product-new-price")
    .text()
    .trim()
    .split(" ")
    .filter((item) => Number(item))[0];
  const results = {
    ProductName: $(".page-header h1").text().trim(),
    ProductUrl: request.url,
    Price:
      priceItem.substring(0, priceItem.length - 2) +
      "," +
      priceItem.substring(priceItem.length - 2),
    Stock:
      $(".main-product-form > div > span").text() === "INDISPONIBIL"
        ? "OutOfStock"
        : "InStock",
  };
  output.push(results);
  log.debug("Pushing data to dataset.");
  await Apify.pushData(results);
  await Apify.setValue("OUTPUT", output);

  // Displaying in terminal the OUTPUT file
  console.dir(output);

  // Used to verify the number of products
  console.log(output.length);
};
