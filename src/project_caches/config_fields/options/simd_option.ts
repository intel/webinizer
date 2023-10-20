/*-------------------------------------------------------------------------------------------------
 *  Copyright (C) 2023 Intel Corporation. All rights reserved.
 *  Licensed under the Apache License 2.0. See LICENSE in the project root for license information.
 *  SPDX-License-Identifier: Apache-2.0
 *-----------------------------------------------------------------------------------------------*/

import { BaseBuildOption, registerOption } from "../option";
import { EnvUpdateSet } from "..";
import { IArg, BuildOptionType, IProjectBuildOptions, EnvType } from "webinizer";

class SimdOption extends BaseBuildOption {
  static __type__: BuildOptionType = "needSimd";

  constructor(name: BuildOptionType, data: IProjectBuildOptions) {
    if (name === SimdOption.__type__) super(name, data);
  }

  updateFromEnvs(currentEnv: EnvType, envFlags: string): EnvUpdateSet {
    const otherEnv: EnvType = currentEnv === "cflags" ? "ldflags" : "cflags";
    const otherEnvFlagsToUpdate: IArg[] = [];

    if (envFlags.includes("-msimd128") && !this.value) {
      this.value = true;
      otherEnvFlagsToUpdate.push({ option: "-msimd128", value: null, type: "replace" });
    } else if (!envFlags.includes("-msimd128") && this.value) {
      this.value = false;
      otherEnvFlagsToUpdate.push({ option: "-msimd128", value: null, type: "deleteAll" });
    }

    return {
      [otherEnv]: otherEnvFlagsToUpdate,
    } as EnvUpdateSet;
  }

  updateToEnvs(): EnvUpdateSet {
    const cflagsToUpdate: IArg[] = [];
    const ldflagsToUpdate: IArg[] = [];
    if (this.value) {
      const arg: IArg = { option: "-msimd128", value: null, type: "replace" };
      cflagsToUpdate.push(arg);
      ldflagsToUpdate.push(arg);
    } else {
      const arg: IArg = { option: "-msimd128", value: null, type: "delete" };
      cflagsToUpdate.push(arg);
      ldflagsToUpdate.push(arg);
    }
    return { cflags: cflagsToUpdate, ldflags: ldflagsToUpdate };
  }
}

// loading
export default function onload() {
  registerOption(SimdOption.__type__, SimdOption);
}
