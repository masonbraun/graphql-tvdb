const express = require("express");
const fs = require("fs");
const request = require("request");
const cheerio = require("cheerio");
const winston = require("winston");
const app = express();

const logger = new winston.Logger({
  transports: [
    new winston.transports.Console({
      colorize: true,
      json: true,
      level: "debug"
    })
  ]
});

const getEpisodeLinks = async () => {
  const episodeLinks = [];

  request("http://memory-alpha.wikia.com/wiki/Star_Trek:_Voyager", function(
    error,
    response,
    html
  ) {
    if (!error) {
      var $ = cheerio.load(html);

      $(".sortable").each((i, element) => {
        $(element)
          .find("tbody")
          .find("tr")
          .slice(1)
          .each((i, element) => {
            let link = $(element)
              .children("td")
              .children("a")
              .attr("href");
            console.log("EP", link);
            // episodeLinks.push(`http://memory-alpha.wikia.com${link}`);

            console.log("FETCHING EPISODE");

            request(`http://memory-alpha.wikia.com${link}`, function(
              error,
              response,
              html
            ) {
              if (!error) {
                var $ = cheerio.load(html);
                let clean = text => text.replace(/"/g, "").replace(/\n/g, "");
                var json = {
                  title: $(".pi-title")
                    .text()
                    .replace(/"/g, ""),
                  logs: [],
                  guests: []
                };

                let logs = $("#Log_entries")
                  .closest("h2")
                  .next("ul")
                  .children()
                  .each(function(i, e) {
                    json.logs.push(clean($(this).text()));
                    // console.log($(this).text());
                  });

                console.log(json);
              }
            });
          });
      });

      // console.log(episodeLinks);
      // return episodeLinks;
    }
  });
};

getEpisodeLinks();

// logger.log("test", { test: "werwer", asdfsdf: 2342 });

app.get("/scrape", function(req, res) {
  // url = "http://memory-alpha.wikia.com/wiki/Caretaker_(episode)";
  // request(url, function(error, response, html) {
  //     if (!error) {
  //         var $ = cheerio.load(html);
  //         console.log($(".pi-title").text());
  //         let clean = text => text.replace(/"/g, "").replace(/\n/g, "");
  //         var title, release, rating;
  //         var json = {
  //             title: $(".pi-title")
  //                 .text()
  //                 .replace(/"/g, ""),
  //             logs: [],
  //             guests: []
  //         };
  //         let logs = $("#Log_entries")
  //             .closest("h2")
  //             .next("ul")
  //             .children()
  //             .each(function(i, e) {
  //                 json.logs.push(clean($(this).text()));
  //                 // console.log($(this).text());
  //             });
  //         let guests = $("#Guest_stars")
  //             .closest("h3")
  //             .next("ul")
  //             .children()
  //             // .last()
  //             .each(function(i, e) {
  //                 json.guests.push(
  //                     clean(
  //                         $(this)
  //                             .children()
  //                             .last()
  //                             .text()
  //                     )
  //                 );
  //                 // console.log(
  //                 //     $(this)
  //                 //         .children()
  //                 //         .last()
  //                 //         .text()
  //                 // );
  //             });
  //         // console.log(guests);
  //         // $(".header").filter(function() {
  //         //     var data = $(this);
  //         //     title = data
  //         //         .children()
  //         //         .first()
  //         //         .text();
  //         //     release = data
  //         //         .children()
  //         //         .last()
  //         //         .children()
  //         //         .text();
  //         //     json.title = title;
  //         //     json.release = release;
  //         // });
  //         // $(".star-box-giga-star").filter(function() {
  //         //     var data = $(this);
  //         //     rating = data.text();
  //         //     json.rating = rating;
  //         // });
  //     }
  //     // To write to the system we will use the built in 'fs' library.
  //     // In this example we will pass 3 parameters to the writeFile function
  //     // Parameter 1 :  output.json - this is what the created filename will be called
  //     // Parameter 2 :  JSON.stringify(json, null, 4) - the data to write, here we do an extra step by calling JSON.stringify to make our JSON easier to read
  //     // Parameter 3 :  callback function - a callback function to let us know the status of our function
  //     fs.writeFile("output.json", JSON.stringify(json, null, 4), function(
  //         err
  //     ) {
  //         console.log(
  //             "File successfully written! - Check your project directory for the output.json file"
  //         );
  //     });
  //     // Finally, we'll just send out a message to the browser reminding you that this app does not have a UI.
  //     res.send("Check your console!");
  // });
});

app.listen("8081");
logger.log("Magic happens on port 8081");
