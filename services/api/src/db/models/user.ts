import { FilterQuery } from "mongoose";
import { getAuth0User } from "../../clients/auth0";
import { IUser, EnrichedUser } from "../../types";
import { User } from "../schemas/user";
import { BaseModel } from "./base";

export const userModel = new BaseModel(User);

export const getEnrichedUsers = async (filters: FilterQuery<IUser>) => {
  const users = await userModel.get(filters);
  const auth0Users = await Promise.all(
    users.map((user) => getAuth0User(user.auth0Id)),
  );
  const enrichedUsers = [] as EnrichedUser[];
  for (let i = 0; i < users.length; i++) {
    const { _id, status, role } = users[i];
    const { email, name, picture, user_id } = auth0Users[i];

    enrichedUsers.push({
      auth0Id: user_id,
      _id,
      status,
      email,
      name,
      picture,
      role,
    });
  }
  return enrichedUsers;
};
