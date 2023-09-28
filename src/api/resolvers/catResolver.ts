import {GraphQLError} from 'graphql';
import {Cat} from '../../interfaces/Cat';
import {locationInput} from '../../interfaces/Location';
import {UserIdWithToken} from '../../interfaces/User';
import rectangleBounds from '../../utils/rectangleBounds';
import catModel from '../models/catModel';
import {Types} from 'mongoose';

// TODO: create resolvers based on cat.graphql
// note: when updating or deleting a cat, you need to check if the user is the owner of the cat
// note2: when updating or deleting a cat as admin, you need to check if the user is an admin by checking the role from the user object

export default {
  Query: {
    cats: async () => {
      return await catModel.find();
    },
    catById: async (_parent: undefined, args: { id: Types.ObjectId }) => {
      return await catModel.findById(args.id);
    },
    catsByArea: async (_parent: undefined, args: locationInput) => {
      const bounds = rectangleBounds(args.topRight, args.bottomLeft);

      return await catModel.find({
        location: {
          $geoWithin: {
            $geometry: bounds,
          },
        },
      });
    },
    catsByOwner: async (_parent: undefined, args: { ownerId: Types.ObjectId }) => {
      return await catModel.find({ owner: args.ownerId });
    },
  },
  Mutation: {
    createCat: async (_parent: undefined, args: Cat, user: UserIdWithToken) => {
      if (!user.id) {
        throw new GraphQLError('Not authorized', { extensions: { code: 'NOT_AUTHORIZED' } });
      }

      args.owner = user.id as unknown as Types.ObjectId;
      const cat = new catModel(args);
      console.log(cat);
      return await cat.save();
    },
    updateCat: async (_parent: undefined, args: Cat, user: UserIdWithToken) => {
      if (!user.id) {
        throw new GraphQLError('Not authorized', { extensions: { code: 'NOT_AUTHORIZED' } });
      }

      const cat = await catModel.findById(args.id);
      console.log("TÄSSÄ CAT", cat);
      console.log("TÄSSÄ USER", user);
      if (!cat) {
        throw new GraphQLError('Cat not found', { extensions: { code: 'NOT_FOUND' } });
      }
      if (cat.owner.toString() !== user.id) {
        throw new GraphQLError('Not the owner', { extensions: { code: 'NOT_THE_OWNER' } });
      }

      return await catModel.findByIdAndUpdate(args.id, args, { new: true });
    },
    deleteCat: async (_parent: undefined, args: { id: Types.ObjectId }, user: UserIdWithToken) => {
      if (!user.id) {
        throw new GraphQLError('Not authorized', { extensions: { code: 'NOT_AUTHORIZED' } });
      }

      const cat = await catModel.findById(args.id);
      if (!cat) {
        throw new GraphQLError('Cat not found', { extensions: { code: 'NOT_FOUND' } });
      }
      if (cat.owner.toString() !== user.id) {
        throw new GraphQLError('Not the owner', { extensions: { code: 'NOT_THE_OWNER' } });
      }

      return await catModel.findByIdAndDelete(args.id);
    },
    updateCatAsAdmin: async (_parent: undefined, args: Cat, user: UserIdWithToken) => {
      if (!user.id || user.role !== 'admin') {
        throw new GraphQLError('Not authorized as admin', { extensions: { code: 'NOT_AUTHORIZED' } });
      }
      return await catModel.findByIdAndUpdate(args.id, args, { new: true });
    },
    deleteCatAsAdmin: async (_parent: undefined, args: { id: Types.ObjectId }, user: UserIdWithToken) => {
      if (!user.id || user.role !== 'admin') {
        throw new GraphQLError('Not authorized as admin', { extensions: { code: 'NOT_AUTHORIZED' } });
      }
      return await catModel.findByIdAndDelete(args.id);
    },
  },
};
