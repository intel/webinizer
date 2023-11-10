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

export interface IProjectProfileOptions {
  projectPoolDir?: string;
  deletedFlag?: boolean;
}

export function getProfilesFromDetection(options: IProjectProfileOptions): IProjectProfile[] {
  const profiles = getProjectsProfiles(options);
  // sort the demo projects based on id
  const sortedProfiles = sortProjectsBasedOnId(profiles);
  return sortedProfiles;
}

function sortProjectsBasedOnId(profiles: IProjectProfile[]): IProjectProfile[] {
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

/**
 *
 * @param options The options of project profile
 *                - set options.deletedFlag as true to get
 *                  deleted projects profiles
 *                - set options.deletedFlag as false to get
 *                  all available projects profiles
 * @returns Deleted | available project profiles array
 */
function getProjectsProfiles(options: IProjectProfileOptions): IProjectProfile[] {
  const dir = options.projectPoolDir || C.projectPool;
  const profiles = [] as IProjectProfile[];
  const deletedProfiles = [] as IProjectProfile[];
  const projectPool = buildDirTree(dir);
  if (projectPool.children && projectPool.children.length) {
    for (const p of projectPool.children) {
      if (p.type === "directory" && fs.existsSync(path.join(p.path, ".webinizer", "config.json"))) {
        const proj = new Project(p.path);
        const profile = proj.config.getProjectProfile();
        if (profile) {
          Object.assign(profile, { path: p.path });
          if (profile.deleted) {
            deletedProfiles.push(profile);
          } else if (!profile.deleted) {
            profiles.push(profile);
          }
        }
      }
    }
  }

  return options.deletedFlag ? deletedProfiles : profiles;
}
