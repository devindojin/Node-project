import { Schema } from "mongoose";

import { BusinessSetting } from "../types/business-setting";

export abstract class BusinessSettingDbModel {
  public static businessSettingSchema = new Schema(
    {
      is_autoapprove: Boolean,
    },
    { _id: false }
  );

  public static convertToDbModel(
    businessSetting: BusinessSetting
  ): IBusinessSetting {
    return {
      is_autoapprove: businessSetting.is_autoapprove,
    };
  }

  public static convertToDomainModel(
    businessSetting: IBusinessSetting
  ): BusinessSetting {
    return new BusinessSetting(businessSetting.is_autoapprove);
  }
}

export interface IBusinessSetting {
  is_autoapprove: boolean;
}
