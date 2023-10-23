/*-------------------------------------------------------------------------------------------------
 *  Copyright (C) 2023 Intel Corporation. All rights reserved.
 *  Licensed under the Apache License 2.0. See LICENSE in the project root for license information.
 *  SPDX-License-Identifier: Apache-2.0
 *-----------------------------------------------------------------------------------------------*/

import * as C from "./constants";
import fs from "graceful-fs";
import path from "path";
import { buildDirTree } from "./dtree";
import { Project } from "./project";
import { IProjectIcon } from "webinizer";

export interface IProjectProfile {
  /**
   * The project name.
   */
  name?: string;
  /**
   * The project version.
   */
  version?: string;
  /**
   * The absolute path to the config file.
   */
  path?: string;
  /**
   * The project description.
   */
  desc?: string;
  /**
   * The project icon.
   */
  img?: IProjectIcon;
  /**
   * The project category.
   */
  category?: string;
  /**
   * The project id. This is for demo project only.
   */
  id?: number;
  /**
   * Whether the project is deleted or not.
   */
  deleted?: boolean;
}

export function getProfilesFromDetection(projectPoolDir?: string): IProjectProfile[] {
  const dir = projectPoolDir || C.projectPool;
  const profiles = [] as IProjectProfile[];
  const projectPool = buildDirTree(dir);
  if (projectPool.children && projectPool.children.length) {
    for (const p of projectPool.children) {
      if (p.type === "directory" && fs.existsSync(path.join(p.path, ".webinizer", "config.json"))) {
        const proj = new Project(p.path);
        const profile = proj.config.getProjectProfile();
        // update project path to current one
        if (profile && !profile.deleted) {
          Object.assign(profile, { path: p.path });
          profiles.push(profile);
        }
      }
    }
  }

  // sort the demo projects based on id
  if (profiles.length) {
    profiles.sort((a, b) => {
      if (a.id !== undefined && b.id !== undefined) {
        if (a.id > b.id) return 1;
        if (a.id < b.id) return -1;
      } else if (a.id !== undefined && b.id === undefined) {
        return -1;
      } else if (a.id === undefined && b.id !== undefined) {
        return 1;
      }
      return 0;
    });
  }

  return profiles;
}
