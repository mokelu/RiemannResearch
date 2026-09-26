Yes. And I think this is the first time the whole Riemann development model becomes concrete.

For this project, the development sequence should literally be:

1. Research question
   “Jev Read 15 Years of Elon’s Tweets and Scored Every One for Bullshit.”

2. Get the raw data
   We acquire the historical posts first.

3. Put the raw dataset into ClickHouse
   This becomes our permanent research dataset, not a temporary file for one video.

4. Build the first reasoning grammar
   We turn the Sentence Tags into symbols and define the first allowed reasoning movements between them.

   For example:

   ```text
   ASSUMPTION → CLAIM
   CLAIM → EVIDENCE
   CLAIM → OBJECTION
   EVIDENCE → SUPPORT
   CLAIM → CONTRADICTION
   CONTRADICTION → INFERENCE
   INFERENCE → CONCLUSION
   ```

   This is version 0.1 of the reasoning grammar, not the finished system.

5. Build the first Riemann Research Space around the investigation
   The Space should contain the actual things this investigation needs: dataset, search, timeline, tables, charts, notes, AI questions, evidence, findings, and the reasoning structures produced by Jev.

6. Define what the investigation means
   Before asking Jev to “score bullshit,” we need a persistent research definition of what we are looking for:

   contradiction, unverifiable claim, changed position, prediction failure, factual error, joke, opinion, and so on.

   The reasoning grammar gives these things structure rather than leaving them as labels.

7. Run the AI investigation
   Jev and/or other models inspect the posts and produce structured judgments rather than a blob of text.

8. Store the judgments back into Riemann
   Now the Space contains things like:

   ```text
   tweet
   → claim
   → evidence
   → reasoning structure
   → judgment
   → score
   → explanation
   → confidence
   ```

9. Investigate the interesting results
   The system finds the weirdest and most interesting cases, clusters them, builds timelines, compares claims, follows contradictions, and lets us drill down.

10. Produce the video from the Research Space
    The video is basically the story of what we discovered.

    “We analysed X posts. At first we found 8,000 possible cases. Then we filtered them down to 312. And this one was insane…”

11. Publish the research asset
    The underlying dataset, methodology, selected findings, charts, and potentially a public/read-only Research Space become assets of their own.

12. Distribute everything
    The YouTube video is the flagship. Clips, X posts, Reddit discussion, articles, charts, screenshots, individual findings, and dataset links all come from the same investigation.

13. Use the investigation to evolve Riemann
    If the investigation needed timeline comparison, build timeline comparison.

    If it needed evidence linking, build evidence linking.

    If it needed better AI judgement, build that.

    If it needed a better dataset browser, build that.

    If it exposed a missing reasoning movement, add it to the reasoning grammar.

That is the crucial part:

**We do not first build Riemann Research and then find things to make videos about.**

**We pick something fucking interesting to investigate, and the investigation tells us what Riemann Research needs to become.**

And the reasoning grammar follows the same principle.

**We do not sit down and try to invent the perfect reasoning grammar before using it.**

**We build the smallest useful grammar, use it on real research, and let the investigations expand it.**

So for this first one, the actual development path is:

**Elon Tweets → ClickHouse → Reasoning Grammar v0.1 → Riemann Research Space → AI investigation → Findings → Video.**

Then the next investigation makes the grammar and the Space better.

By the time we reach November 30, the reasoning grammar is no longer a theoretical idea we were trying to design in isolation. It is the accumulated reasoning system produced by real investigations.
