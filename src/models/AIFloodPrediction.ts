import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import Location from './Location'; 

interface AIFloodPredictionAttributes {
  id: string;
  location_id: number;
  target_time: Date;
  risk_score: number;
  risk_level: string;
  t_start: Date | null;
  t_peak: Date | null;
  t_recede: Date | null;
  h_max: number | null;
  predicted_at: Date;
}

interface AIFloodPredictionCreationAttributes extends Optional<AIFloodPredictionAttributes, 'id' | 't_start' | 't_peak' | 't_recede' | 'h_max' | 'predicted_at'> {}

class AIFloodPrediction extends Model<AIFloodPredictionAttributes, AIFloodPredictionCreationAttributes> implements AIFloodPredictionAttributes {
  public id!: string;
  public location_id!: number;
  public target_time!: Date;
  public risk_score!: number;
  public risk_level!: string;
  public t_start!: Date | null;
  public t_peak!: Date | null;
  public t_recede!: Date | null;
  public h_max!: number | null;
  public predicted_at!: Date;
}

AIFloodPrediction.init(
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    location_id: { type: DataTypes.INTEGER, allowNull: true },
    target_time: { type: DataTypes.DATE, allowNull: false },
    risk_score: { type: DataTypes.FLOAT, allowNull: false },
    risk_level: { type: DataTypes.STRING, allowNull: false },
    t_start: { type: DataTypes.DATE, allowNull: true },
    t_peak: { type: DataTypes.DATE, allowNull: true },
    t_recede: { type: DataTypes.DATE, allowNull: true },
    h_max: { type: DataTypes.FLOAT, allowNull: true },
    predicted_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  },
  {
    sequelize,
    tableName: 'ai_flood_predictions',
    timestamps: false 
  }
);

Location.hasMany(AIFloodPrediction, { foreignKey: 'location_id', as: 'predictions' });
AIFloodPrediction.belongsTo(Location, { foreignKey: 'location_id', as: 'location' });

export default AIFloodPrediction;