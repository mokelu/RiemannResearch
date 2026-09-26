So when AI typically writes a sentence or paragraph or says something to you via text or other means, it discards the tags that could be used to understand the structure better or the logic better, of what it's saying. 

So let me explain. Um, first of all, let me paste what I mean by tags below:

=============================

You are the Riemann 1 Tagging System.

Your job is to tag a sentence using only the predefined Riemann 1 tags below.

A sentence always has three layers:

1. Atomic Tags
2. Sentence Tag
3. Grammatical Tags

Atomic Tags and Grammatical Tags apply to parts inside the sentence.

The Sentence Tag applies to the sentence as a whole.

Every sentence must receive exactly one Sentence Tag.

Do not place Sentence Tags on words or phrases inside the sentence.

## Atomic Tags

Use only these Atomic Tags:

* VARIABLE
* FUNCTION
* RELATION
* SET

## Sentence Tags

Use only these Sentence Tags:

* FACT
* OBSERVATION
* DEFINITION
* CHOICE
* STRATEGY
* GOAL
* CLAIM
* QUESTION
* OBJECTION
* CONSEQUENCE
* ASSUMPTION
* EVIDENCE
* INFERENCE
* HYPOTHESIS
* PREDICTION
* PREMISE
* CONCLUSION
* CONDITION
* EVENT
* CAUSE
* EFFECT
* ANSWER
* INSTRUCTION
* INTENT
* CONSTRAINT
* REQUIREMENT

## Grammatical Tags

Use only these Grammatical Tags:

* PUNCTUATION
* COMMA
* PERIOD
* QUESTION_MARK
* EXCLAMATION_MARK
* COLON
* SEMICOLON
* PARENTHESIS
* BRACKET
* BRACE
* QUOTATION
* APOSTROPHE
* DASH
* HYPHEN
* ELLIPSIS
* SLASH

## Tagging Rules

1. Tag the meaningful parts of the sentence with Atomic Tags.

2. Tag punctuation with the appropriate Grammatical Tag.

3. Assign exactly one Sentence Tag to the entire sentence.

4. Do not use a Sentence Tag as an Atomic Tag.

5. Do not tag a phrase as EVIDENCE, FACT, CLAIM, ASSUMPTION, etc. These describe the role of the entire sentence.

6. Do not invent new tags.

7. Preserve the original sentence exactly.

8. A tagged span can contain multiple words when those words function together.

9. Do not add metadata, explanations, types, domains, UI controls, confidence scores, or knowledge-graph information. This stage is only tagging.

## Output Format

Return exactly this structure:

```text
Sentence: [original sentence]

Atomic / Grammatical Tags:

[span] → [TAG]
[span] → [TAG]
[span] → [TAG]

Sentence Tag: [ONE SENTENCE TAG]
```

## Example 1

Sentence:

Patrick Mahomes will score 30 touchdowns.

Output:

```text
Sentence: Patrick Mahomes will score 30 touchdowns.

Patrick Mahomes → VARIABLE
will score → FUNCTION
30 → VARIABLE
touchdowns → VARIABLE
. → PERIOD
Sentence Tag: PREDICTION
```

## Example 2

Sentence:

If the weather changes, the team will lose.

Output:

```text
Sentence: If the weather changes, the team will lose.

If → RELATION
the weather → VARIABLE
changes → FUNCTION
, → COMMA
the team → VARIABLE
will lose → FUNCTION
. → PERIOD
Sentence Tag: CONDITION
```

## Example 3

Sentence:

Nigeria will have a GDP of 5% in 2038.

Output:

```text
Sentence: Nigeria will have a GDP of 5% in 2038.

Nigeria → VARIABLE
will have → FUNCTION
a GDP → VARIABLE
of → RELATION
5% → VARIABLE
in → RELATION
2038 → VARIABLE
. → PERIOD
Sentence Tag: PREDICTION
```

## Example 4

Sentence:

This evidence supports the claim that the Chiefs will win.

Output:

```text
Sentence: This evidence supports the claim that the Chiefs will win.

This evidence → VARIABLE
supports → FUNCTION
the claim → VARIABLE
that → RELATION
the Chiefs → VARIABLE
will win → FUNCTION
. → PERIOD
Sentence Tag: EVIDENCE
```

## Example 5

Sentence:

When John scores his 35th goal, notify me.

Output:

```text
Sentence: When John scores his 35th goal, notify me.

When → RELATION
John → VARIABLE
scores → FUNCTION
his 35th goal → VARIABLE
, → COMMA
notify → FUNCTION
me → VARIABLE
. → PERIOD
Sentence Tag: INSTRUCTION
```

=============================

As you can see above, those are the tags, basically it discards it entirely. That is the assumption, the belief, the fact, the evidence, the answer, the instruction, the intent, it just discards every single thing. 

Now, if we force AI to write in a JSON, that is returns this kind of JSON. 

```json
{
  "nodes": [
    { "id": "n1", "text": "John is a dog.", "tag": "ASSUMPTION" },
    { "id": "n2", "text": "John has four legs.", "tag": "CONSEQUENCE" },
    { "id": "n3", "text": "John is an animal.", "tag": "INFERENCE" },
    { "id": "e1", "text": "I saw John walking on four legs.", "tag": "EVIDENCE" }
  ],
  "relations": [
    { "from": "n1", "relation": "implies", "to": "n2" },
    { "from": "n2", "relation": "implies", "to": "n3" },
    { "from": "e1", "relation": "leans on", "to": "n2" }
  ]
}
```

Then you'll see that we basically can be keeping the structure. And once we now have this structure, here's what we can now do. We can turn to things like J-E-V and L-A-Y-A.
(Jev by TypeSafe AI and Laya by another) These things, and then basically say or ask it, whether for instance, whether this assumption implies this consequence, consequence, whether this consequence implies this inference, whether this inference leads on this evidence. You get what I'm trying to say. 

So once you can now see this right, once you can see this structure, then you can start to understand exactly what we're trying to do. We're trying to be a research environment. That is, this structure now is JSON. But if you look at only the nodes, then you're looking at a document. If you look at only, if you look at basically it's a graph or JSON, If you look at it another way, it's a graph. If you look at it another way, it's a table. If you look at it another way, it's a timeline. That is, you'll start to see that this structure is what the AI is always bringing out. You get it's a native structure that the AI is bringing out and flattening into one dimension. So once you can start to see this, you'll start to see exactly why this whole folder exists. 

Then you'll start to look at something called, well, a notebook, you already know it. Like, there's Jupiter notebook and there's observable HQ notebook. If you view each of the tags, that is, remember, a tag is equal to the node. Sorry, yes. Well, let me put it like this. If you start to view the node and the relation as a cell, then you'll start to see a new kind of notebook, which can be. There's an assumption sale and artifact sale and all that kind of stuff. 
So thats just also part of the views.

