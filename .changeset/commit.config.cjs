/** @type {import('@changesets/types').CommitFunctions} */
module.exports = {
  getVersionMessage: ({ releases: [release] }) => {
    if (!release) return Promise.reject(new Error("no release"));
    return Promise.resolve(`🔖 package: v${release.newVersion}`);
  },
};
