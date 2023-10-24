/*-------------------------------------------------------------------------------------------------
 *  Copyright (C) 2023 Intel Corporation. All rights reserved.
 *  Licensed under the Apache License 2.0. See LICENSE in the project root for license information.
 *  SPDX-License-Identifier: Apache-2.0
 *-----------------------------------------------------------------------------------------------*/

import * as H from "./helper";
import fs from "graceful-fs";
import path from "path";
import { Project } from "./project";
import multiparty from "multiparty";
import errorCode from "./error_code";
import { IProjectIcon } from "webinizer";

const log = H.getLogger("icons");

const projectIconFolder = ".webinizer/icons";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function handleUploadIcon(root: string, req: any, res: any) {
  const multiParty = new multiparty.Form(req);
  multiParty.parse(req, async (err, _, files) => {
    try {
      if (err) throw err;
      const fileName = path.parse(String(files.file[0].originalFilename)).base;
      const fileSize = Number(files.file[0].size);

      checkUploadIconType(files.file[0].path);
      checkFileSize(fileSize);

      const targetFilePath = constructIconPath(root, fileName);
      fs.renameSync(String(files.file[0].path), targetFilePath);

      // update project config
      const proj = new Project(root);
      const imgName = path.basename(targetFilePath);
      await proj.config.updateRawJson({
        img: { name: imgName, isUploaded: true },
      });

      res.status(200).json({ iconName: imgName });
      return;
    } catch (error) {
      log.error("upload project icon error\n", H.normalizeErrorOutput(error as Error));
      res.status(400).json(H.serializeError(error as Error));
      return;
    }
  });
}

function checkUploadIconType(path: string): boolean {
  const imageSignatures = [
    "ffd8ffe0", // JPEG
    "89504e47", //PNG
    "47494638", //GIF
  ];

  const buffer = fs.readFileSync(path);
  const fileSignature = buffer.toString("hex", 0, 8);

  if (!imageSignatures.some((signature) => fileSignature.startsWith(signature)))
    throw new H.WError(
      `Uploaded file's type is not allowed.`,
      errorCode.WEBINIZER_FILE_UNSUPPORTED_ENCODING
    );

  return true;
}

function checkFileSize(fileSize: number): boolean {
  /* the size maximum is 1 MB */
  if (fileSize > 1024 * 1024) {
    throw new H.WError(
      `File's size reached the limit.`,
      errorCode.WEBINIZER_FILE_SIZE_REACHED_LIMIT
    );
  }

  return true;
}

function constructUploadedIconsFolder(root: string): string {
  /** the icons of one project are stored under
   *  root/.webinizer/icons
   */
  // check if root/.webinizer exists, throw error if not
  if (!fs.existsSync(path.resolve(root, ".webinizer"))) {
    throw new H.WError("Project root path doesn't exist.", errorCode.WEBINIZER_ROOT_NOEXT);
  }

  const iconsStoredFolder = path.resolve(root, projectIconFolder);
  if (!fs.existsSync(iconsStoredFolder)) {
    fs.mkdirSync(iconsStoredFolder, { recursive: true });
  }
  return iconsStoredFolder;
}

function constructIconPath(root: string, fileName: string): string {
  const timestamp = new Date().toISOString().replace(/[^a-zA-Z0-9]/g, "");
  const uniqueTargetName = `${timestamp}-${fileName}`;
  return path.resolve(constructUploadedIconsFolder(root), uniqueTargetName);
}

/**
 * @param host : the host of the server
 * @param root : the root of project, it means to get default icons
 *               if the root is null
 *
 */
export function constructAllAvailableIcons(root?: string): IProjectIcon[] {
  // get all default icons
  let icons: IProjectIcon[];
  const defaultIconFolderPath = path.resolve(__dirname, "assets/icons/default");
  const defaultIcons = fs
    .readdirSync(defaultIconFolderPath)
    .filter((file) => {
      // only images files can be kept
      try {
        return checkUploadIconType(path.resolve(defaultIconFolderPath, file));
      } catch (err) {
        return false;
      }
    })
    .map((icon) => {
      return { name: icon, isUploaded: false };
    });
  icons = defaultIcons;

  // get uploaded icon under root/.webinizer/icons
  if (root && fs.existsSync(path.resolve(root, projectIconFolder))) {
    const projUploadIconFolderPath = path.resolve(root, projectIconFolder);
    const uploadIcons = fs
      .readdirSync(projUploadIconFolderPath)
      .filter((file) => {
        try {
          return checkUploadIconType(path.resolve(projUploadIconFolderPath, file));
        } catch (err) {
          return false;
        }
      })
      .map((icon) => {
        return { name: icon, isUploaded: true };
      });
    icons = uploadIcons.concat(icons);
  }

  return icons;
}

/**
 *
 * @param host
 * @param root
 * @param iconURL the http request URL of this icon
 * @returns
 */
export function removeIcon(root: string, iconURL: string): IProjectIcon[] {
  // resolve the iconURL to avoid that the `..` is the last part
  const absIconURL = path.resolve(iconURL);
  const iconPath = path.resolve(root, projectIconFolder, path.basename(absIconURL));

  if (!fs.existsSync(iconPath)) {
    throw new H.WError(`File doesn't exist.`, errorCode.WEBINIZER_FILE_NOEXT);
  }

  fs.rmSync(iconPath);
  return constructAllAvailableIcons(root);
}
