export const getMajorNodeVersion = () => {
  const version = process.version;
  return Number(version.substring(1, version.indexOf('.')));
};
