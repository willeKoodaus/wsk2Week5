import {GraphQLError} from 'graphql';
import {Cat} from '../../interfaces/Cat';
import LoginMessageResponse from '../../interfaces/LoginMessageResponse';
import {User, UserIdWithToken} from '../../interfaces/User';
import fetchData from '../../functions/fetchData';
import AuthMessageResponse from '../../interfaces/AuthMessageResponse';
import MessageResponse from '../../interfaces/MessageResponse';
// TODO: create resolvers based on user.graphql
// note: when updating or deleting a user don't send id to the auth server, it will get it from the token
// note2: when updating or deleting a user as admin, you need to check if the user is an admin by checking the role from the user object


export default {
  Cat: {
    owner: async (parent: Cat) => {
      console.log("KISSA PARENT", parent);
      const ownerString = parent.owner.toString();
      console.log("OWNER STRING", ownerString);
      const owner = await fetchData<AuthMessageResponse>(
        `${process.env.AUTH_URL}/users/${ownerString}`
      );
      console.log("OWNER", owner);
      return owner.user;
    },
  },
    Query: {
      users: async () => {
        const users = await fetchData<AuthMessageResponse>(
          `${process.env.AUTH_URL}/users`
        );
        console.log(users);
        return users.user;
      },
      userById: async (_parent: undefined, args: { id: string }) => {
        const user = await fetchData<AuthMessageResponse>(
          `${process.env.AUTH_URL}/users/${args.id}`
        );
        console.log(user);
        return user.user;
      },
      checkToken: async () => {
        // Implementation for checking token goes here
      },
    },
  
    Mutation: {
      login: async (_parent: undefined, args: { credentials: { username: string, password: string } }) => {
        const options: RequestInit = {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({email: args.credentials.username, password: args.credentials.password}),
        };
  
        const user = await fetchData<LoginMessageResponse>(
          `${process.env.AUTH_URL}/auth/login`,
          options
        );
        console.log("useresolver rivi 45 ",user);
        return user;
      },
      register: async (_parent: undefined, args: {user: User}) => {
        const options: RequestInit = {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(args.user),
        };
  
        const response = await fetchData<MessageResponse>(
          `${process.env.AUTH_URL}/users`,
          options
        );
          console.log(response);
          return response;
      },
  
      updateUser: async (_parent: undefined, args: { user: User }, userToken: UserIdWithToken) => {
        try {
          // You would usually fetch the user by their token
          console.log("user update", userToken.token, args.user);
          const options: RequestInit = {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken.token}` },
            body: JSON.stringify(args.user),
          };
          console.log("user update", options);
          const user = await fetchData<LoginMessageResponse>(
            `${process.env.AUTH_URL}/users/`,  // Ensure this matches your REST API route
            options
          );
      
          // You can add further checks here, like if user.error or some error field exists, then throw an error.
          
          console.log("user update", user);
          return user;
      
        } catch (error) {
          console.error("Error updating user:", error);
          throw new GraphQLError('Error updating user.');
        }
      },
      
  
    deleteUser: async (_parent: undefined, args: { user: User }, userToken: UserIdWithToken) => {
        const options: RequestInit = {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken.token}` },
          body: JSON.stringify(args.user),
        };
      const user = await fetchData(`${process.env.AUTH_URL}/users/`, options);
      return user;
    },

   
     updateUserAsAdmin: async (_parent: undefined, args: { user: User, id: string }, userToken: UserIdWithToken) => {
      if (userToken.role !== 'admin') {
        throw new GraphQLError('Unauthorized: Must be an admin to update user.');
      }

      const options: RequestInit = {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(args.user),
      };

      const user = await fetchData(`${process.env.AUTH_URL}/users/`, options);
      console.log("UPDATE USER USER", user);
      return user;
    },
    deleteUserAsAdmin: async (_parent: undefined, args: { id: string }, userToken: UserIdWithToken) => {
      if (userToken.role !== 'admin') {
        throw new GraphQLError('Unauthorized: Must be an admin to delete user.');
      }
    
      const options: RequestInit = {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken.token}` },
        body: JSON.stringify({ userId: args.id }),  // Sending the user ID in the body
      };
    
      const deletedUser = await fetchData(`${process.env.AUTH_URL}/users/`, options);
      return deletedUser;
    },
    

  }, 
};

