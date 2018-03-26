const fetch = require('node-fetch');
const util = require('util');
const parseXML = util.promisify(require('xml2js').parseString);
const { GraphQLSchema, GraphQLObjectType, GraphQLInt, GraphQLString, GraphQLList, GraphQLFloat } = require('graphql');

const trek = require('./trek.js').trek;

console.log(trek.trek);

const TVDB = require('node-tvdb');
const tvdb = new TVDB('0BCF6724EEDAB59C');

const Post = new GraphQLObjectType({
  name: 'Post',
  description: '...',

  fields: () => ({
    title: {
      type: GraphQLString,
      resolve: xml => xml.title
    },
    body: {
      type: GraphQLString,
      resolve: xml => xml.body
    }
  })
});

const BookType = new GraphQLObjectType({
  name: 'Book',
  description: '...',

  fields: () => ({
    title: {
      type: GraphQLString,
      resolve: xml => xml.title[0]
    },
    isbn: {
      type: GraphQLString,
      resolve: xml => xml.isbn[0]
    }
  })
});

const AuthorType = new GraphQLObjectType({
  name: 'Author',
  description: '...',

  fields: () => ({
    // name: {
    //     type: GraphQLString,
    //     resolve: xml => xml.GoodreadsResponse.author[0].name[0]
    // },
    books: {
      type: new GraphQLList(BookType),
      resolve: xml => {
        console.log(xml);
        // xml.GoodreadsResponse.author[0].books[0].book
      }
    }
  })
});

const SeriesType = new GraphQLObjectType({
  name: 'Series',
  description: '...',

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
        // return xml.episodes;
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
      resolve: xml => xml.episodeName
    },
    season: {
      type: GraphQLInt,
      resolve: xml => xml.airedSeason
    },

    number: {
      type: GraphQLInt,
      resolve: xml => xml.airedEpisodeNumber
    },
    synposis: {
      type: GraphQLString,
      resolve: xml => xml.overview
    },
    production: {
      type: GraphQLString,
      resolve: xml => {
        return xml.overview;
      }
    },
    stardate: {
      type: GraphQLFloat,
      resolve: xml =>
        Number(
          xml.overview
            .split('\r\n', 1)[0]
            .split('Stardate:')[1]
            .trim()
        )
    },
    thumbnail: {
      type: GraphQLString,
      resolve: xml =>
        tvdb
          .getEpisodeById(xml.id)
          .then(response => {
            return response.filename;
          })
          .catch(error => {})
    },
    production_code: {
      type: GraphQLString,
      resolve: xml =>
        tvdb
          .getEpisodeById(xml.id)
          .then(response => {
            return response.productionCode;
          })
          .catch(error => {})
    },
    logs: {
      type: new GraphQLList(GraphQLString),
      resolve: xml =>
        tvdb
          .getEpisodeById(xml.id)
          .then(response => {
            return response.productionCode;
          })
          .then(code => {
            let sup = trek.filter(word => word.production_code == code);
            return sup[0].logs;
          })
          .catch(error => {})
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
        resolve: (root, args) =>
          tvdb
            .getSeriesAllById(args.id)
            .then(response => {
              // console.log(response);
              return response;
            })
            .catch(error => {})
      }
    })
  })
});
