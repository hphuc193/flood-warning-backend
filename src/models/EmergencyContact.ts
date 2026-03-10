import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface ContactAttributes {
  id: number;
  user_id: number;
  name: string;
  phone_number: string;
  relation: string | null; // Mối quan hệ: Bố, Mẹ, Vợ, Chồng...
}

interface ContactCreationAttributes extends Optional<ContactAttributes, 'id' | 'relation'> {}

class EmergencyContact extends Model<ContactAttributes, ContactCreationAttributes> implements ContactAttributes {
  public id!: number;
  public user_id!: number;
  public name!: string;
  public phone_number!: string;
  public relation!: string | null;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

EmergencyContact.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phone_number: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    relation: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'emergency_contacts',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default EmergencyContact;