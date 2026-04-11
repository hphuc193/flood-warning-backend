import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

interface ReportVoteAttributes {
  id?: number;
  report_id: number;
  user_id: number;
  type: 'upvote' | 'downvote';
}

class ReportVote extends Model<ReportVoteAttributes> implements ReportVoteAttributes {
  public id!: number;
  public report_id!: number;
  public user_id!: number;
  public type!: 'upvote' | 'downvote';
}

ReportVote.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    report_id: { type: DataTypes.INTEGER, allowNull: false },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    type: { type: DataTypes.ENUM('upvote', 'downvote'), allowNull: false }
  },
  {
    sequelize,
    tableName: 'report_votes',
    timestamps: true,
    underscored: true,
    indexes: [
      { unique: true, fields: ['report_id', 'user_id'] } // Đảm bảo 1 user chỉ vote 1 lần cho 1 report
    ]
  }
);

export default ReportVote;