const fetch = require('node-fetch');
const util = require('util');
const parseXML = util.promisify(require('xml2js').parseString);
const { GraphQLSchema, GraphQLObjectType, GraphQLInt, GraphQLString, GraphQLList, GraphQLFloat } = require('graphql');
const DataLoader = require('dataloader');
const trek = require('./trek.js').trek;

const TVDB = require('node-tvdb');
const tvdb = new TVDB('0BCF6724EEDAB59C');

const getSeriesById = id => {
  return tvdb
    .getSeriesAllById(id)
    .then(response => response)
    .catch(error => {});
};

const getEpisodeById = id => {
  return tvdb
    .getEpisodeById(id)
    .then(response => response)
    .catch(error => {});
};

const seriesLoader = new DataLoader(keys => {
  console.log(keys);
  return Promise.all(keys.map(key => getSeriesById(key)));
});

const episodeLoader = new DataLoader(keys => {
  console.log(keys);
  return Promise.all(keys.map(key => getEpisodeById(key)));
});

const crossReference = id => {
  return new Promise(async resolve => {
    let remoteEpisode = await episodeLoader.load(id);
    let localEpisode = trek.filter(word => word.production_code == remoteEpisode.productionCode);
    resolve(localEpisode[0]);
  });
};

const SeriesType = new GraphQLObjectType({
  name: 'Series',
  fields: () => ({
    name: {
      type: GraphQLString,
      resolve: xml => xml.seriesName
    },
    episodes: {
      type: new GraphQLList(EpisodeType),
      args: {
        season: { type: GraphQLInt }
      },
      resolve: (root, args) => {
        return root.episodes.filter(episode => episode.airedSeason === args.season);
      }
    }
  })
});

const EpisodeType = new GraphQLObjectType({
  name: 'Episode',
  description: '...',

  fields: () => ({
    name: {
      type: GraphQLString,
      resolve: data => data.episodeName
    },
    season: {
      type: GraphQLInt,
      resolve: data => data.airedSeason
    },
    number: {
      type: GraphQLInt,
      resolve: data => data.airedEpisodeNumber
    },
    synposis: {
      type: GraphQLString,
      resolve: data => data.overview
    },
    production_code: {
      type: GraphQLInt,
      resolve: async data => {
        let episode = await episodeLoader.load(data.id);
        console.log(episode);
        return Number(episode.productionCode);
      }
    },
    logs: {
      type: new GraphQLList(GraphQLString),
      resolve: async data => {
        let episode = await crossReference(data.id);
        return episode.logs;
      }
    },
    dates: {
      type: DatesType,
      resolve: async data => {
        let episode = await crossReference(data.id);
        return episode.dates;
      }
    },
    characters: {
      type: CharactersType,
      resolve: async data => {
        let episode = await crossReference(data.id);
        return episode.characters;
      }
    },
    images: {
      type: ImagesType,
      resolve: async data => {
        let episode = await episodeLoader.load(data.id);
        return episode;
      }
    }
  })
});

const DatesType = new GraphQLObjectType({
  name: 'Dates',
  fields: () => ({
    earth: {
      type: GraphQLInt,
      resolve: dates => dates.earth
    },
    star: {
      type: GraphQLFloat,
      resolve: dates => dates.star
    }
  })
});

const CharactersType = new GraphQLObjectType({
  name: 'Characters',
  fields: () => ({
    main: {
      type: new GraphQLList(GraphQLString),
      resolve: characters => characters.main
    },
    guests: {
      type: new GraphQLList(GraphQLString),
      resolve: characters => characters.guests
    }
  })
});

const ImagesType = new GraphQLObjectType({
  name: 'Images',
  fields: () => ({
    thumbnail: {
      type: GraphQLString,
      resolve: episode => `https://www.thetvdb.com/banners/${episode.filename}`
    },
    title: {
      type: GraphQLString,
      resolve: async data => {
        let episode = await crossReference(data.id);
        return episode.images.titleCard;
      }
    },
    wassup: {
      type: GraphQLString,
      resolve: async data => {
        let episode = await crossReference(data.id);
        return episode.images.episodeImage;
      }
    }
  })
});

module.exports = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: 'Query',
    description: '...',

    fields: () => ({
      series: {
        type: SeriesType,
        args: {
          id: { type: GraphQLInt }
        },
        resolve: async (root, args) => {
          return await seriesLoader.load(args.id);
        }
      }
    })
  })
});
