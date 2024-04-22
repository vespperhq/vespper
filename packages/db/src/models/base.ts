import mongoose, { FilterQuery, Types } from "mongoose";

export class BaseModel<T> {
  private readonly model: mongoose.Model<T>;
  constructor(model: mongoose.Model<T>) {
    this.model = model;
  }

  get(query: FilterQuery<T> = {}) {
    return this.model.find(query);
  }

  getOne(query: FilterQuery<T>) {
    return this.model.findOne(query);
  }

  getOneByEncryptedField(query: FilterQuery<T>) {
    const fieldToSearch = new this.model(query);
    fieldToSearch.encryptFieldsSync();

    const search = Object.keys(query).reduce((total, key) => {
      return {
        ...total,
        [key]: fieldToSearch[key as keyof typeof fieldToSearch],
      };
    }, {} as FilterQuery<T>);

    return this.model.findOne(search);
  }

  getOneById(id: string | Types.ObjectId) {
    return this.model.findById(id);
  }

  getOneAndUpdate(query: FilterQuery<T>, data: Partial<T>) {
    return this.model.findByIdAndUpdate(query, data);
  }

  getOneAndUpdateByFilter(
    query: FilterQuery<T>,
    data: Partial<T>,
    options: object = {},
  ) {
    return this.model.findOneAndUpdate(query, data, options);
  }

  getOneByIdAndUpdate(id: string | Types.ObjectId, data: Partial<T>) {
    return this.model.findByIdAndUpdate(id, data);
  }

  create(data: Partial<T>) {
    return this.model.create(data);
  }

  deleteOneById(id: string | Types.ObjectId) {
    return this.model.findByIdAndDelete(id);
  }

  delete(query: FilterQuery<T>) {
    return this.model.deleteMany(query);
  }
}
