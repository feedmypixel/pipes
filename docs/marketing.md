# Pipes — Distribution & Launch Notes

Where to broadcast Pipes, and how to set up for the next launch (stat).

## TL;DR

The low LinkedIn engagement isn't the product — it's the venue. Pipes has a sharp,
well-defined pain point ("find out main broke from your browser, not from a teammate")
and a real differentiator (fully client-side, no server, no tracking). The job now is to
match the channel to where the pain actually lives, and to build an owned channel that
compounds into the stat launch.

## Why LinkedIn underperformed

- The algorithm actively suppresses posts containing external links.
- The audience skews recruiters, managers and founders — not the engineer annoyed at a
  silently broken pipeline.
- "Here's my extension, check it out" isn't a story. LinkedIn rewards narrative and
  identity, not raw utility.
- A single broadcast to the wrong room with a throttled link was never going to land.

## Channels, ranked by fit

1. **Hacker News — "Show HN."** Highest fit. The "I built this because I was tired of
   finding out from Slack" framing plays perfectly, and the client-side / no-server /
   privacy stance is catnip for that crowd. Being at 0.1.0 is fine — HN rewards "early,
   here's the honest state, feedback welcome." Post mid-week morning US time; reply to
   every comment.
2. **Reddit (targeted subs):** r/devops (big, exactly the audience), r/gitlab, r/github,
   r/chrome_extensions, r/SideProject. Read each sub's self-promo rules first — several
   want a participant, not a drive-by, and some have weekly "show off" threads. Lead with
   the problem, not the pitch.
3. **Written post on dev.to / Hashnode:** Not "my extension" but "watching CI/CD across
   GitHub and GitLab without a dashboard tab open" — the problem and how it was solved,
   tool linked at the end. Earns SEO + a backlink, and the same piece can be syndicated to
   the communities above.
4. **Niche spots:** GitLab community forum, platform-engineering Discords/Slacks, DevOps
   newsletters (submit to roundups). Smaller reach, near-perfect intent.
5. **Product Hunt:** worth a coordinated launch for the spike and backlinks, but plan it
   rather than fire it off solo.

## Practical gap

The store listing shows 0 ratings. A handful of genuine installs and reviews from people
who'll actually use it does a lot for store ranking and social proof — seed this quietly
before any bigger push.

## Messaging

- "I find it super useful" is the strongest asset — the authentic builder-scratching-
  own-itch story is what converts on HN and Reddit, where polished-launch tone falls flat.
- Lead with the annoyance (silently broken default branch), make the no-server / privacy
  point explicit, link last.

## The real point — pave the way for stat

Broadcasts don't compound. A LinkedIn post or a Show HN spikes and vanishes, and then stat
launches from zero all over again.

To start the next release with momentum, build a channel you **own** now:

- A FeedMyPixel dev blog with a couple of decent posts (the Pipes build, the Firefox port,
  the MSAL/CORS debugging war story).
- RSS / email capture on it.
- A consistent presence on one platform where devs actually hang out.

Then Pipes becomes the first entry in a body of work rather than a one-off, and stat ships
to an audience that already exists. The Pipes launch is the dry run; the asset built around
it is the real point.
