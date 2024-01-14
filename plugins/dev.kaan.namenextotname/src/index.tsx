import { Injector, common, util, webpack } from "replugged";

const {
  React,
  toast: {
    Kind: { SUCCESS },
    toast,
  },
} = common;

const { copy } = (
  await webpack.waitForModule<{ default: { copy: (yes: string) => unknown } }>(
    webpack.filters.byProps("copy"),
  )
).default;

const NameWithRole = await webpack.waitForModule<{ H: (something: string) => unknown }>(
  webpack.filters.byProps("NameWithRole"),
);

const inject = new Injector();

const DisplayName = ({ username, discriminator, startCopy, color }) => {
  // this now exists.
  // please make it easier on yourself with your next plugin.
  // exporting this stuff and MAKING it organized.
  const displayDiscriminator = discriminator && discriminator !== "0" ? `#${discriminator}` : "";

  return (
    <text
      style={{ userSelect: "none", color }}
      onClick={() => startCopy(username)}>{` @${username}${displayDiscriminator}`}</text>
  );
};

export function start() {
  inject.after(NameWithRole, "H", (a: any) => {
    const nameHolder = a[0]?.children;
    const className: string = a[0]?.className;

    if (className?.includes("header")) {
      const childrenArray = nameHolder[2]?.props?.children?.props?.children as Array<any>;
      const filterFunction: (tree: Record<string, unknown>) => boolean = (x) =>
        Boolean(x?.username);
      const actualUsername = util.findInTree(a, filterFunction);

      if (actualUsername) {
        const filterColorFunction: (tree: Record<string, unknown>) => boolean = (x) =>
          Boolean(x?.colorString) && Boolean(x?.nick);
        const guildAuthor = util.findInTree(a, filterColorFunction);
        let colorString: string = "#000000";
        if (guildAuthor) {
          colorString = guildAuthor.colorString;
        }
        const { username, discriminator } = actualUsername;
        const displayDiscriminator =
          discriminator && discriminator !== "0" ? `${discriminator}` : "";
        const displayName = (
          <DisplayName
            username={username}
            discriminator={displayDiscriminator}
            startCopy={startCopy}
            color={colorString}
          />
        );

        childrenArray?.splice(2, 0, displayName);
      }
    }
  });

  function startCopy(text: string) {
    copy(text);
    toast("Copied username to clipboard!", SUCCESS);
  }
}

export function stop() {
  inject.uninjectAll();
}
