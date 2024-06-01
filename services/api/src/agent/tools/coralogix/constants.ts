// This is a summarized version of the Coralogix DataPrime Cheatsheet Guide (used ChatGPT).
// // https://coralogix.com/docs/dataprime-cheat-sheet/
export const DATAPRIME_CHEATSHEET = `
### Coralogix DataPrime Cheatsheet Guide Summary

**Introduction**

DataPrime is a powerful query language for transforming data, especially JSON logs, using various operations.

**Language Basics**

- **Data Types**: \`boolean\`, \`number/num\`, \`string\`, \`timestamp\`
- **Helper Types**: \`Interval\`, \`Regexp\`

**Expressions**: Consist of literals, functions, methods, operators, cast, and groupings.

**Operators**: Commands to transform JSON data streams. Examples include \`filter\`, \`extract\`, \`sortby\`, \`groupby\`, \`orderby\`, \`find\`, \`choose\`.

**Binary Operators**: You can use logical AND: && and logical OR: ||
**Query Format**

\`\`\`
source logs | operator1 ... | operator2 ... | operator3 | ...
\`\`\`
Whitespace between operators is ignored, supporting multiline queries.

**Commonly Used Operators**

1. **filter**: Select logs based on conditions.
   \`\`\`shell
   source logs | filter result == 'success'
   \`\`\`

2. **limit**: Restrict the number of logs returned.
   \`\`\`shell
   source logs | filter result == 'success' | limit 10
   \`\`\`

3. **orderby**: Order logs by specified fields.
   \`\`\`shell
   source logs | filter result == 'success' | orderby duration_ms desc | limit 10
   \`\`\`

4. **find**: Free-text search within a field.
   \`\`\`shell
   source logs | find 'started' in msg | filter stream == 'stdout'
   \`\`\`

5. **wildfind**: Wildcard search across logs.
   \`\`\`shell
   source logs | wildfind 'coralogix'
   \`\`\`

6. **lucene**: Full Lucene query syntax.
   \`\`\`shell
   source logs | lucene 'region:"us-east-1" AND "coralogix"'
   \`\`\`

7. **convert**: Change the data type of a field.
   \`\`\`shell
   source logs | filter version:number > 32
   \`\`\`

8. **choose/select**: Select specific fields to include in the output.
   \`\`\`shell
   source logs | filter result == 'success' | choose result, duration_ms
   \`\`\`

9. **count/countby**: Count logs, optionally grouping by a field.
   \`\`\`shell
   source logs | countby result
   \`\`\`

10. **groupby**: Group logs and apply aggregation functions.
    \`\`\`shell
    source logs | groupby result calc avg(duration_ms),max(duration_ms)
    \`\`\`

11. **distinct**: Get unique values of a field.
    \`\`\`shell
    source logs | distinct region
    \`\`\`

12. **enrich**: Add contextual data from a lookup table.
    \`\`\`shell
    enrich $d.userid into $d.user_enriched using my_users
    \`\`\`

13. **extract**: Extract data from semi-structured text using patterns.
    \`\`\`shell
    source logs | extract msg into stats using regexp(/# Query_time: (?<duration>.*?) Lock_time: (?<lock_time>.*?) /)
    \`\`\`

14. **move**: Rename or move keys within logs.
    \`\`\`shell
    source logs | move query_id to query_identifier
    \`\`\`

15. **replace**: Replace field values.
    \`\`\`shell
    source logs | replace user.name with 'anyone'
    \`\`\`

### Examples
- **Fetch all logs for the last 24 hours**
  \`\`\`shell
  source logs
  \`\`\`
- **Fetch all logs that contain 500 in their msg **
  \`\`\`shell
  source logs | filter msg.contains('500')
  \`\`\`
- **Fetch all logs that contain 500 and AuthError in their message **
  \`\`\`shell
  source logs | filter msg.contains('500') && msg.contains('AuthError')
  \`\`\`
- **Filter logs for success and duration greater than 2 seconds**
  \`\`\`shell
  source logs | filter result == 'success' && duration_ms / 1000 > 2
  \`\`\`

- **Get top 3 regions by log count**
  \`\`\`shell
  source logs | top 3 region by count()
  \`\`\`

- **Convert and filter based on data type**
  \`\`\`shell
  source logs | convert version:number | filter version > 32
  \`\`\`

- **Group by result and calculate average and max duration**
  \`\`\`shell
  source logs | groupby result calc avg(duration_ms) as avg_duration,max(duration_ms) as max_duration
  \`\`\`

### Additional Notes

- **Enrichment**: Enrich logs dynamically or during ingestion.
- **Extraction**: Extract using regex, JSON object conversion, or key-value pairs.
- **Ordering**: Support for both alphabetical and numerical ordering, including case-insensitive options.
- **Creating Fields**: Use \`create\` to add new fields with computed or constant values.
- **Moving Fields**: \`move\` for renaming or relocating fields within logs.
- **Replacing Values**: \`replace\` to substitute field values, including using template syntax.

This guide provides the necessary tools to start using DataPrime efficiently for querying and transforming data.
`;
