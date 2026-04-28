import { Request, Response } from 'express';
import AIFloodPrediction from '../models/AIFloodPrediction';
import { Op } from 'sequelize';
import moment from 'moment-timezone';

// Lấy dự báo 24h tới cho một khu vực
export const getFloodForecast = async (req: Request, res: Response) => {
  try {
    const location_id = parseInt(req.params.location_id as string);
    
    if (!location_id) {
      return res.status(400).json({ success: false, message: 'Thiếu location_id' });
    }

    const now = new Date();
    const endTime = moment(now).add(24, 'hours').toDate();

    const predictions = await AIFloodPrediction.findAll({
      where: {
        location_id: location_id,
        target_time: {
          [Op.between]: [now, endTime]
        }
      },
      order: [['target_time', 'ASC']]
    });

    // 🌟 ĐÃ SỬA CHỖ NÀY: Trả về 200 và mảng rỗng thay vì 404
    if (predictions.length === 0) {
      return res.status(200).json({ 
        success: true, 
        message: 'Hệ thống AI đang xử lý, vui lòng thử lại sau ít phút.',
        data: {
          location_id: location_id,
          timeline_summary: null,
          forecast_chart: [] // Mảng rỗng để Flutter không bị crash
        }
      });
    }

    const summary = {
      t_start: predictions[0].t_start,
      t_peak: predictions[0].t_peak,
      t_recede: predictions[0].t_recede,
      h_max: predictions[0].h_max
    };

    return res.status(200).json({
      success: true,
      data: {
        location_id: location_id,
        timeline_summary: summary,
        forecast_chart: predictions.map(p => ({
          time: p.target_time,
          risk_score: p.risk_score,
          risk_level: p.risk_level,
          water_level_cm: p.h_max
        }))
      }
    });

  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
};