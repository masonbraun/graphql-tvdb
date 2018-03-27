const express = require('express');
const fs = require('fs');
const request = require('request');
let cheerio = require('cheerio');
const cheerioAdv = require('cheerio-advanced-selectors');
const winston = require('winston');
var Promise = require('promise');
const download = require('image-downloader');
var cloudinary = require('cloudinary');
const app = express();

cloudinary.config({
  cloud_name: 'dyaurodrv',
  api_key: '739425384736328',
  api_secret: '2rXoi5b4SswR6vwjcN7ZCTvP6bY'
});

// cloudinary.uploader.upload('https://vignette.wikia.nocookie.net/memoryalpha/images/b/b0/Forest_of_Forever.jpg/revision/latest?cb=20070930202049&path-prefix=en', function(result) {
//   console.log(result);
// });

cheerio = cheerioAdv.wrap(cheerio);

const logger = new winston.Logger({
  transports: [
    new winston.transports.Console({
      colorize: true,
      json: true,
      level: 'debug'
    })
  ]
});

// download
//   .image({
//     url: 'https://vignette.wikia.nocookie.net/memoryalpha/images/0/02/1x10_Prime_Factors_title_card.jpg/revision/latest?cb=20160711010658&path-prefix=en',
//     dest: '/Users/braunm/Downloads/image.jpg'
//   })
//   .then(({ filename, image }) => {
//     console.log('File saved to', filename);
//   })
//   .catch(err => {
//     throw err;
//   });

const doEverything = async () => {
  let links = await getEpisodeLinks();

  let wassup = [];

  for (let num of links) {
    let result = await getEpisodeData(num);
    wassup.push(result);
  }

  console.log(wassup);
  writeFile(wassup);
};

const getEpisodeData = link => {
  return new Promise((resolve, reject) => {
    request(`http://memory-alpha.wikia.com${link}`, function(error, response, html) {
      if (!error) {
        var $ = cheerio.load(html);
        let clean = text => text.replace(/"/g, '').replace(/\n/g, '');

        // ALWYAS START HERE

        let title = $('.pi-title')
          .text()
          .replace(/"/g, '');

        let code = $('.portable-infobox div:nth-child(3)')
          .text()
          .trim();
        let production_code = Number(code.replace('Production number:', '').trim());

        let dates = $('nav.pi-navigation')
          .text()
          .split(' ');

        let starDate = parseFloat(dates[0].trim());
        let earthDate = Number(dates[1].replace(/[()]/g, ''));

        let titleCard = $('figure.pi-image:eq(1) a img')
          .attr('src')
          .replace('/scale-to-width-down/350', '');

        let episodeImage = $('figure.pi-image:eq(0) a img')
          .attr('src')
          .replace('/scale-to-width-down/350', '');

        var json = {
          production_code: production_code,
          title: title,
          dates: {
            star: starDate,
            earth: earthDate
          },
          images: {
            titleCard: titleCard,
            episodeImage: episodeImage
          },
          logs: [],
          characters: {
            main: [],
            guests: [],
            costars: []
          },
          quotes: []
        };

        let logs = $('#Log_entries')
          .closest('h2')
          .next('ul')
          .children()
          .each(function(i, e) {
            json.logs.push(clean($(this).text()));
          });

        let mainCast = $('#Main_cast, #Starring, #Also_starring')
          .closest('h3')
          .next('ul')
          .children()
          .each(function(i, e) {
            let character = $(this)
              .children()
              .last()
              .text()
              .trim();
            json.characters.main.push(character);
          });

        let guestStars = $('#Guest_star, #Guest_stars')
          .closest('h3')
          .next('ul')
          .children()
          .each(function(i, e) {
            let character = $(this)
              .children()
              .last()
              .text()
              .trim();
            json.characters.guests.push(character);
          });

        let coStars = $('#Co-stars')
          .closest('h3')
          .next('ul')
          .children()
          .each(function(i, e) {
            let character = $(this)
              .children()
              .last()
              .text()
              .trim();
            json.characters.costars.push(character);
          });

        let quotes = $('#Memorable_quotes')
          .closest('h2')
          .nextAll('p')
          .each(function(i, e) {
            let character = $(this)
              .text()
              .replace(/['"]+/g, '')
              .trim();
            // console.log(character.children());

            let speaker = $(this)
              .next('dl')
              .text()
              .replace('-', '')
              .trim();

            let quote = {
              quote: character,
              speaker: speaker
            };

            json.quotes.push(quote);
          });

        // always end here
        // console.log(json);
        resolve(json);
      }
    });
  });
};

const getEpisodeLinks = () => {
  return new Promise((resolve, reject) => {
    request('http://memory-alpha.wikia.com/wiki/Star_Trek:_Voyager', function(error, response, html) {
      if (!error) {
        var $ = cheerio.load(html);
        let links = [];

        $('.sortable').each((i, element) => {
          $(element)
            .find('tbody')
            .find('tr')
            .slice(1)
            .each((i, element) => {
              let link = $(element)
                .children('td')
                .children('a')
                .attr('href');
              links.push(link);
            });
          resolve(links);
        });
      }
    });
  });
};

const getSingleEpisodeData = link => {
  request(`http://memory-alpha.wikia.com/wiki/Prime_Factors_(episode)`, function(error, response, html) {
    if (!error) {
      var $ = cheerio.load(html);
      let clean = text => text.replace(/"/g, '').replace(/\n/g, '');

      //start
      let title = $('.pi-title')
        .text()
        .replace(/"/g, '');

      let code = $('.portable-infobox div:nth-child(3)')
        .text()
        .trim();
      let production_code = Number(code.replace('Production number:', '').trim());

      let dates = $('nav.pi-navigation')
        .text()
        .split(' ');

      let starDate = parseFloat(dates[0].trim());
      let earthDate = Number(dates[1].replace(/[()]/g, ''));

      let titleCard = $('figure.pi-image:eq(1) a img')
        .attr('src')
        .replace('/scale-to-width-down/350', '');

      let episodeImage = $('figure.pi-image:eq(0) a img')
        .attr('src')
        .replace('/scale-to-width-down/350', '');

      var json = {
        production_code: production_code,
        title: title,
        dates: {
          star: starDate,
          earth: earthDate
        },
        images: {
          titleCard: titleCard,
          episodeImage: episodeImage
        },
        logs: [],
        characters: {
          main: [],
          guests: [],
          costars: []
        },
        quotes: []
      };

      let logs = $('#Log_entries')
        .closest('h2')
        .next('ul')
        .children()
        .each(function(i, e) {
          json.logs.push(clean($(this).text()));
        });

      let mainCast = $('#Main_cast, #Starring, #Also_starring')
        .closest('h3')
        .next('ul')
        .children()
        .each(function(i, e) {
          let character = $(this)
            .children()
            .last()
            .text()
            .trim();
          json.characters.main.push(character);
        });

      let guestStars = $('#Guest_star, #Guest_stars')
        .closest('h3')
        .next('ul')
        .children()
        .each(function(i, e) {
          let character = $(this)
            .children()
            .last()
            .text()
            .trim();
          json.characters.guests.push(character);
        });

      let coStars = $('#Co-stars')
        .closest('h3')
        .next('ul')
        .children()
        .each(function(i, e) {
          let character = $(this)
            .children()
            .last()
            .text()
            .trim();
          json.characters.costars.push(character);
        });

      let quotes = $('#Memorable_quotes')
        .closest('h2')
        .nextAll('p')
        .each(function(i, e) {
          let character = $(this)
            .text()
            .replace(/['"]+/g, '')
            .trim();
          // console.log(character.children());

          let speaker = $(this)
            .next('dl')
            .text()
            .replace('-', '')
            .trim();

          let quote = {
            quote: character,
            speaker: speaker
          };

          json.quotes.push(quote);
        });

      //end

      console.log(json);
    }
  });
};

const writeFile = json => {
  fs.writeFile('output.json', JSON.stringify(json, null, 4), function(err) {
    console.log('File successfully written! - Check your project directory for the output.json file');
  });
};

getSingleEpisodeData();
// doEverything();

app.listen('8081');
logger.log('Magic happens on port 8081');
