/*-------------------------------------------------------------------------------------------------
 *  Copyright (C) 2023 Intel Corporation. All rights reserved.
 *  Licensed under the Apache License 2.0. See LICENSE in the project root for license information.
 *  SPDX-License-Identifier: Apache-2.0
 *-----------------------------------------------------------------------------------------------*/

import chalk from "chalk";
import * as H from "../../helper";
import errorCode from "../../error_code";
import { BuildOptionType, IProjectBuildOptions } from "webinizer";
import { IBuildOption } from ".";

const log = H.getLogger("option");

export class BaseBuildOption implements IBuildOption {
  name: BuildOptionType;
  private _data: IProjectBuildOptions;
  constructor(name: BuildOptionType, data: IProjectBuildOptions) {
    this.name = name;
    this._data = data;
  }

  get data(): IProjectBuildOptions {
    return this._data;
  }

  get value(): boolean {
    return this.data[this.name] || false;
  }

  set value(v: boolean) {
    this.data[this.name] = v;
  }
}

const ALL_OPTIONS_MAP = new Map<BuildOptionType, typeof BaseBuildOption>();

export function registerOption(type: BuildOptionType, optionClass: typeof BaseBuildOption) {
  log.info(`* ${chalk.yellowBright(`<< Option >>`)} - registered ${chalk.cyanBright(type)}`);
  ALL_OPTIONS_MAP.set(type, optionClass);
}

export function optionFromType(type: BuildOptionType): typeof BaseBuildOption {
  const optionClass = ALL_OPTIONS_MAP.get(type);
  if (!optionClass)
    throw new H.WError(
      `Unknown config option type ${type}`,
      errorCode.WEBINIZER_BUILD_OPTION_UNKNOWN
    );
  return optionClass;
}
