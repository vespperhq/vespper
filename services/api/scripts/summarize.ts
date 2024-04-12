import { chatModel } from "../src/agent/model";
// import { getCommonLogFields } from "../src/agent/tools/coralogix/get_common_keys";

(async () => {
  // const apiKey = "cxup_k8CXE7BnoVN7uSyvvxxiJp9gZbf12a";
  // const baseURL =
  //   "https://ng-api-http.eu2.coralogix.com/api/v1/dataprime/query";
  // const commonFields = await getCommonLogFields(apiKey, baseURL);
  const commonFields = [
    "cx_rum.log_context.message",
    "cx_rum.session_context.browser",
  ];

  const prompt = `
    The following is a Cheatsheet of Coralogix's DataPrime query language:
    ----------------------------------------------------------------------
  Use our innovative DataPrime language not only to query your data, but transform it using a series of operations in a manner that it meaningful for you.

  This Cheat Sheet will enable you to hit the ground running using DataPrime. A complete glossary of all DataPrime operators and expressions can be found here.

  Language Basics

  DataPrime supports data and helper types, expressions, and operators.

  Data & Helper Types

  DataPrime supports the following data types:

  boolean: >, <, =, true or false
  number/num: 42
  string: “foo”
  timestamp: 10-10-2021:11:11

  It also supports several helper types, used as arguments for functions or operators, including:

  Interval: duration of time
  Regexp: standard regular expressions
  Expressions

  Expressions consist of literals, functions / methods, operators, cast, and / or groupings that return data.

  literals: 42
  functions: length($.foo)
  methods :$d.foo.length() //just alternative syntax for functions
  operator expressions: 1 + $d.foo
  cast: $d.foo:string
  groupings: (…)
  Operators

  Use operators as commands that transform unstructured streams of JSON data and creates a new stream for a specified time period. Examples include: filter, extract, sortby, groupby, orderby, find, choose.

  Find out more about the language building blocks here.

  Format

  Query format is as follows:

  source logs | operator1 ... | operator2 ... | operator3 | ...

  Any whitespace between operators is ignored, allowing to write queries as multiline queries:

  source logs
    | operator1 ....
    | operator2 ....
    | operator3 ....
  Most Frequently Used Operators: Examples

  The following section provides use-cases of most frequently used operators, so you can hit the ground running. View a full glossary of all operators and expressions here.

  Example input data:

  # Input Examples
  { region: "us-east-1", az: "us-east-1a", duration_ms: 231, result: 'success' }
  { region: "us-east-1", az: "us-east-1b", duration_ms: 2222, result: 'failure' }
  { region: "eu-west-1", az: "eu-west-1a", duration_ms: 501, result: 'success' }
  { region: "eu-west-2", az: "eu-west-2a", duration_ms: 23, result: 'success' }
  filter

  Get only logs which signify success:

  source logs
  | filter result == 'success'

  # Result - Full raw logs

  Get only logs which signify failure in the eu-west-1 region:

  # Option 1
  source logs
  | filter result == 'failure' && region == 'eu-west-1'

  # Option 2
  source logs
  | filter result == 'failure'
  | filter region == 'eu-west-1'

  # Result - Full raw logs

  Get only logs which have a region that starts with eu- :

  source logs
  | filter region.startsWith('eu-')

  # Result - Full raw logs

  Get only logs which have a duration larger than 2 seconds:

  source logs
  | filter duration_ms / 1000 > 2

  # Result - Full raw logs

  Get all the logs except the ones which have a ap-southeast-1 region (3 options):

  # Option 1
  source logs
  | filter region != 'ap-southeast-1'

  # Option 2
  source logs
  | filter !(region == 'ap-southeast-1')

  # Option 3
  source logs
  | block region == 'ap-southeast-1'

  Get 10 success logs which have a duration larger than 2 seconds:

  source logs
  | filter result == 'success' && duration_ms / 1000 > 2
  | limit 10

  # Result - Full raw logs

  Order the success logs by descending duration fetching the top-most 10 logs:

  source logs
  | filter result == 'success'
  | orderby duration_ms desc
  | limit 10

  # Result - Full raw logs

  Do a free-text search on the msg field, returning only logs which have the word “started” in them. Combine the free-text search with another filter (the stream field has the value stdout):

  # Query 1 -  Using the find operator for finding the text in msg, and then filtering using the filter operator
  source logs
  | find 'started' in msg
  | filter stream == 'stdout'

  # Results 1 - Full raw logs

  # Query 2 - Using the ~ predicate and combining the free-text search and the filter into one expression that is passed to filter
  source logs
  | msg ~ 'started' && filter stream == 'stdout'

  # Result - Full raw logs

  Perform a wild-search of text inside the entire log:

  # Option 1 - Using wildfind operator
  source logs
  | wildfind 'coralogix'

  # Option 2 - Inside an expression
  source logs
  | filter $d ~~ 'coralogix'

  # Result - Full raw logs

  Use a full Lucene query to filter results:

  source logs
  | lucene 'region:"us-east-1" AND "coralogix"'

  Convert the data type of a key: Get the logs whose version field contains a value greater than 32.

  Input Data Example:
  { "version" : "12", ... }
  { "version": "17", ... }
  { "version": "65", ... }

  # Option 1 - By casting
  source logs
  | filter version:number > 32

  # Option 2 - Using convert operator
  source logs
  | convert version:number
  | filter version > 32

  Get success logs, but choose only result and duration fields for the output:

  # Option 1 - Using the choose operator
  source logs
  | filter result == 'success'
  | choose result, duration_ms

  # Option 2 - Using the select operator, which is just an alias for choose
  source logs
  | filter result == 'success'
  | select result, duration_ms

  # Result - Only result and duration keys will remain in each event
  choose

  Get success logs, but choose only result and duration fields for the output.

  # Option 1 - Using the choose operator
  source logs
  | filter result == 'success'
  | choose result, duration_ms

  # Result - Only result and duration keys will remain in each event

  Construct a new object using choose. The output fields will be as follows:

  outcome which will contains the value of the result field from the original log
  duration_seconds which will contain the original duration_ms divided by 1000 in order to convert it to seconds
  A new field called meaning_of_life which will contain the value 42
  source logs
  | choose result as outcome, duration_ms / 1000 as duration_seconds, 42 as meaning_of_life

  # Result - Notice the key names have been changed according to the "as X" parts
  { "outcome": "success", "duration_seconds": 2.54, "meaning_of_life": 42 }
  { "outcome": "failure", "duration_seconds": 0.233, "meaning_of_life": 42 }
  count / countby

  Count all the success logs:

  source logs
  | filter result == 'success'
  | count

  # Result - Total number of logs after filtering

  Count logs, grouped by success/failure:

  source logs
  | ountby result

  # Result - Number of logs per result value
  { "result": "success", "_count": 847 }
  { "result": "failure", "_count": 22 }

  Count logs, grouped success/failure per region, with the results in a new field named request_count:

  source logs
  | countby region,result into request_count

  # Result - Notice that the count keyname is set to request_count because of "into request_count"
  { "region": "eu-west-1", "result": "success", "request_count": 287 }
  { "region": "eu-west-1", "result": "failure", "request_count": 2 }
  { "region": "eu-west-2", "result": "success", "request_count": 2000 }
  { "region": "eu-west-3", "result": "success", "request_count": 54 }
  { "region": "eu-west-3", "result": "failure", "request_count": 2 }

  Count events in each region, and return the top 3 regions:

  source logs
  | top 3 region by count()

  # Result - 3 rows, each containing a region and a count of logs

  Average the duration in seconds for each region, and return the lowest (bottom) 3 regions:

  source logs
  | bottom 3 regions by avg(duration_ms)

  # Result - 3 rows, each containing a region and an average duration
  groupby

  Get the average and maximum durations for successes/failures:

  # Option 1 - Output keypaths are named automatically
  source logs
  | groupby result calc avg(duration_ms),max(duration_ms)

  # Result 1
  { "result": "success", "_avg": 23.4, "_max": 287 }
  { "result": "failure", "_avg": 980.1, "_max": 1000.2 }

  # Option 2 - Using "as X" to name the output keypaths
  source logs
  | groupby result calc avg(duration_ms) as avg_duration,max(duration_ms) as max_duration

  # Result 2
  { "result": "success", "average_duration": 23.4, "max_duration": 287 }
  { "result": "failure", "average_duration": 980.1, "max_duration": 1000.2 }

  When querying with the groupby operator, you can now apply an aggregation function (such as avg, max, sum) to the bucket of results. This feature gives you the power to manipulate an aggregation expression inside the expression itself, allowing you to calculate and manipulate your data simultaneously. Examples of DataPrime expressions in aggregations can be found here.

  distinct

  Get distinct regions from the data, grouping logs by region name without any aggregations.

  # Input Examples:
  { "region": "us-east-1", ... }
  { "region": "us-east-1", ... }
  { "region": "eu-west-1", ... }

  # Query 1 - Get distinct regions from the data
  source logs
  | distinct region

  # Results 1 - distinct region names
  { "region": "us-east-1" }
  { "region": "eu-west-1" }
  enrich

  Enrich and filter your logs using additional context from a lookup table. For example, enrich user activity logs with the user’s department and then retrieve logs of all users in the Finance department.

  First, upload the lookup table:

  Go to Data Flow > Data Enrichment page > Custom Enrichment section, and add Custom Enrichment. For more details see the Custom Enrichment documentation.

  There are two possible ways to enrich your logs:

  Select log key to look up for a key value and enrich the logs automatically during ingestion. The logs are saved with the enriched fields. The advantages of this mode:
  Logs are automatically enriched.
  The logs themselves include the enrichment data, which makes it easier to consume everywhere (by any query, and also by third-party products that read the logs from the S3 bucket).
  Use the DataPrime enrich query to look up for a value in this table and enrich the log dynamically for the purpose of the query. The advantages of this mode:
  It allows you to enrich old logs already ingested into Coralogix.
  The enrichment does not increase the size of the stored logs, as the enrichment is done dynamically, only for the query results.

  The syntax:

  enrich <value_to_lookup> into <enriched_key> using <lookup_table>

  The <value_to_lookup> (name of a log key or the actual value) will be looked up in the Custom Enrichment <lookup_table> and a key called <enriched_key> will be added to the log, containing all table columns as sub-keys. If the <value_to_lookup> is not found in the <lookup_table>, the <enriched_key> will still be added but with “null” values, in order to preserve the same structure for all result logs. You can then filter the results using the DataPrime capabilities, such as filtering logs by specific value in the enriched field.

  Example

  The original log:

  {
    "userid": "111",
    ...
  }

  The Custom Enrichment lookup table called “my_users”:

  ID	Name	Department
  111	John	Finance
  222	Emily	IT

  Running the following query:

  enrich $d.userid into $d.user_enriched using my_users

  Gives the following enriched log:

  {
    "userid": "111",
    "user_enriched": {
      "ID: "111",
      "Name": "John",
      "Department": "Finance"
    },
    ...
  }

  Notes:

  Run the DataPrime query source <lookup_table> to view the enrichment table.
  If the original log already contains the enriched key:
  If <value_to_lookup> exists in the <lookup_table>, the sub-keys will be updated with the new value. If the <value_to_lookup> does not exist, their current value will remain.
  Any other sub-keys which are not columns in the <lookup_table> will remain with their existing values.
  All values in the <lookup_table> are considered to be strings. This means that:
  The <value_to_lookup> must be in a string format.
  All values are enriched in a string format. You may then convert them to your preferred format (e.g. JSON, timestamp) using the appropriate functions.
  extract

  extract allows you to take some semi-structured text, and extract meaningful data out of it. There are multiple methods to extract this data:

  regexp – Extract using regular expression capture-groups
  jsonobject – Take a stringified JSON and extract it to a real object
  kv – Extract key=value pairs from a string

  The extracted values can also be converted to their real data type as part of the extraction. This is done by adding datatypes clause that contains the required conversions (same syntax as the convert operator).

  Examples

  Extract information from a text field using a regular expression:

  # Input Data Examples:
  { "msg": "... Query_time: 2.32 Lock_time: 0.05487 ..." }
  { "msg": "... Query_time: 0.1222 Lock_time: 0.0002 ..." }
  ...

  # Example 1

  # Query 1
  source logs
  // Filter the relevant logs using lucene
  | lucene '"Query_time:"'
  // Extract duration and lock_time strings from the msg field
  | extract msg into stats using regexp(
    /# Query_time: (?<duration>.*?) Lock_time: (?<lock_time>.*?) /)
  // Choose to leave only the stats object that the extraction has created
  | choose stats

  # Results 1 - Output contains strings
  { "stats": { "duration": "0.08273" , "lock_time": "0.00121" } }
  { "stats": { "duration": "0.12" , "lock_time": "0.001" } }
  { "stats": { "duration": "3.121" , "lock_time": "0.83322" } }
  ...

  # Query 2 - Added datatypes clause, so the extracted values will be numbers instead of strings
  source logs
  | lucene '"Query_time:"'
  | extract msg into stats using regexp(
    /# Query_time: (?<duration>.*?) Lock_time: (?<lock_time>.*?) /)
    datatypes duration:number,lock_time:number
  | choose stats

  # Results 1 - Output contains real numbers and not strings (see above example)
  { "stats": { "duration": 0.08273 , "lock_time": 0.00121 } }
  { "stats": { "duration": 0.12 , "lock_time": 0.001 } }
  { "stats": { "duration": 3.121 , "lock_time": 0.83322 } }
  ...

  # Query 3 - Use the extracted values in a later operator, in this case a filter
  source logs
  | lucene '"Query_time:"'
  | extract msg into stats using regexp(
    /# Query_time: (?<duration>.*?) Lock_time: (?<lock_time>.*?) /)
    datatypes duration:number,lock_time:number
  | choose stats
  // Filter for only the logs which contain a lock_time which is above 0.5
  | filter stats.lock_time > 0.5

  # Results 1 - Output contains real numbers
  { "stats": { "duration": 3.121 , "lock_time": 0.83322 } }
  ...

  Extract a JSON object stored in a string:

  Input Data Examples:
  {"my_json": "{\\"x\\": 100, \\"y\\": 200, \\"z\\": {\\"a\\": 300}}" , "some_value": 1}
  {"my_json": "{\\"x\\": 400, \\"y\\": 500, \\"z\\": {\\"a\\": 600}}" , "some_value": 2}
  ...

  # Query 1
  source logs
  | **extract my_json into my_data using jsonobject()**

  # Results 1
  {
    "my_json": "..."
    "my_data": {
      "x": 100,
      "y": 200,
      "z": 300
    }
    "some_value": 1
  }
  {
    "my_json": "..."
    "my_data": {
      "x": 400,
      "y": 500,
      "z": 600
    }
    "some_value": 2
  }

  # Query 2 - Additional filtering on the resulting object
  source logs
  | extract my_json into my_data using jsonobject()
  | **filter my_data.x = 100**

  # Results 2 - Only the object containing x=100 is returned

  Extract key=value data from a string. Notice that the kv extraction honors quoted values.

  # Example data for Query 1
  { "log": "country=Japan city=\\"Tokyo\\"" , ... }
  { "log": "country=Israel city=\\"Tel Aviv\\"" , ... }
  ...

  # Query 1
  source logs
  | extract log into my_data using kv()

  # Results 1
  {
    "log": "..."
    "my_data": {
      "country": "Japan"
      "city": "tokyo"
    }
    ...
  }
  {
    "log": "..."
    "my_data": {
      "country": "Israel"
      "city": "Tel Aviv"
    }
    ...
  }

  # Example Data for Query 2 - Key/Value delimiter is ":" and not "="
  { "log": "country:Japan city:\\"Tokyo\\"" , ... }
  { "log": "country:Israel city:\\"Tel Aviv\\"" , ... }
  ...

  # Query 2
  source logs
  | extract log into my_data using kv(':')

  # Results 2 - Same results as query 1
  orderby/sortby

  Order the successes by descending duration fetching the top-most 10 logs:

  source logs
  | filter result == 'success'
  | orderby duration_ms desc
  | limit 10

  # Result - Full raw logs

  Numerically order a string field which effectively contains numbers:

  # Input Data Examples:
  { "error_code": "23" }
  { "error_code": "12" }
  { "error_code": "4" }
  { "error_code": "1" }

  # Query 1

  source logs
  | orderby error_code:number

  # Results 1 - Ordered by numeric value
  { "error_code": "1" }
  { "error_code": "4" }
  { "error_code": "12" }
  { "error_code": "23" }

  # Query 2 - By using the convert operator
  source logs
  | convert error_code:number
  | orderby error_code

  # Results 2 - Same results

  Order by alphabetical order of multiple fields. [Note: Ordering is case-sensitive; A-Z will be ordered before a-z.]

  # Example Input Data:
  { "last_name": "musk" , "first_name": "elon" }
  { "last_name": "jobs", "first_name": "steve" }
  ...

  # Query
  source logs
  | orderby last_name,first_name

  Same example but with case-insensitive ordering:

  source logs
  | orderby toLowerCase(last_name),toLowerCase(first_name)
  orderby

  Create a new keypath value:

  # Example Input Data
  { "country": "Japan", "city": "Tokyo" }
  { "country": "Israel", "city": "Jerusalem" }
  ...

  # Query 1
  source logs
  | create default_temperature from 32.5

  # Results 1 - Each log contains the new field, with the same value
  { "country": "Japan", "city": "Tokyo", "default_temperature": 32.5 }
  { "country": "Israel", "city": "Jerusalem", "default_temperature": 32.5 }
  ...

  # Query 2 - Create a new field which contains the first three letters of the country, converted to uppercase
  source logs
  | create country_initials from toUpperCase(substr(country,1,3))

  # Results 2
  { "country": "Japan", "city": "Tokyo", "country_initials": "JAP" }
  { "country": "Israel", "city": "Jerusalem", "country_initials": "ISR" }

  # Input Examples for Query 3
  { ... , "temp_in_fahrenheit": 87.2 }
  { ... , "temp_in_fahrenheit": 32 }
  ...

  # Query 3
  source logs
  | create temp_in_celcius from (temp_in_fahrenheit - 32) * 5 / 9

  # Results 3
  { ... , "temp_in_fahrenheit": 87.2, "temp_in_celcius": 30.66666 }
  { ... , "temp_in_fahrenheit": 32, "temp_in_celcius": 0.0 }
  ...

  # Query 3 - Create a new field containing <country>/<city> as a string. Uses string-interpolation syntax
  source logs
  | create country_and_city from \`{country}/{city}\`

  # Results 3
  { "country": "Japan", "city": "Tokyo", "country_and_city": "Japan/Tokyo" }
  { "country": "Israel", "city": "Jerusalem", "country_and_city": "Israel/Jerusalem" }
  move

  This operator can be used to move a source keypath to a target keypath, including entire subtrees. It can also be used for renaming a keypath.

  For nested source keypaths, only the actual key is moved, merging the target keypath with any other objects or keys which already exist in the data.

  When moving an entire subtree, the target keypath will serve as the root of the new subtree.

  Examples

  Move a key to a target location:

  Input Data Example:
  { "query_id": "AAAA", "stats": { "total_duration": 23.3 , "total_rows: 500 }}
  ...

  # Query 1 - Rename a keypath
  source logs
  | move query_id to query_identifier

  # Results 1 - Keypath renamed
  { "query_identifier": "AAAA", "stats": { "total_duration": 23.3 , "total_rows: 500 } }
  ...

  # Query 2 - Move a key to an existing subtree
  source logs
  | move query_id to stats.query_id

  # Results 2 - query_id moved below "stats"
  { "stats": { "total_duration": 23.3 , "total_rows: 500, "query_id": "AAAA" } }
  ...

  Move subtree to another location:

  # Query 1 - Rename subtree
  source logs
  | move stats to execution_data

  # Results 1 - Rename subtree
  { "query_identifier": "AAAA", "execution_data": { "total_duration": 23.3 , "total_rows: 500 } }
  ...

  # Query 2 - Move subtree to root
  source logs
  | move stats to $d

  # Results 2
  { "query_id": "AAAA", "total_duration": 23.3 , "total_rows: 500 }
  ...

  # Input Data Examples for Query 3
  { "request": { "id": "1000" } , "user": { "name": "james", "id": 50 } }
  ...

  # Query 3 - Move subtree to another subtree
  source logs
  | move user to request.user_info

  # Results 3 - Entire user subtree moved below request.user_info
  { "request": { "id": "1000", "user_info": { "name": "james", "id": 50 } } }
  ...
  replace

  Replace the value in an existing keypath:

  # Input Data Examples:
  { "user": { "id": "1000" , "name": "James", "email": "james@coralogix.com" } }
  { "user": { "id": "2000" , "name": "John", "email": "john@coralogix.com" } }
  ...

  # Example 1
  replace user.name with 'anyone'

  # Results 1
  { "user": { "id": "1000" , "name": "anyone", "email": "james@coralogix.com" } }
  { "user": { "id": "2000" , "name": "anyone", "email": "john@coralogix.com" } }
  ...

  # Example 2
  replace user.name with user.email

  # Results 2
  { "user": { "id": "1000" , "name": "james@coralogix.com", "email": "james@coralogix.com" } }
  { "user": { "id": "2000" , "name": "john@coralogix.com", "email": "john@coralogix.com" } }

  # Example 3
  replace user.name with \`UserName={user.id}\`

  # Results 3
  { "user": { "id": "1000" , "name": "UserName=1000", "email": "james@coralogix.com" } }
  { "user": { "id": "2000" , "name": "UserName=2000", "email": "john@coralogix.com" } }
  ...
  remove

  Examples

  # Input Data Examples:
  {
    "stats": {
      "duration_ms": 2.34,
      "rows_scanned": 501,
      "message": "Operation has taken 2.34 seconds"
    },
    "some_value": 1000
  }
  ...

  # Query 1 - Remove the message keypath
  source logs
  | remove stats.message

  # Results 1
  {
    "stats": {
      "duration_ms": 2.34,
      "rows_scanned": 501
    },
    "some_value": 1000
  }
  ...

  # Query 2 - Remove the entire stats subtree
  source logs
  | remove stats

  # Results 2
  {
    "some_value": 1000
  }
  ...
  redact

  Examples

  Input Examples:
  { "serverIp": "ip-172-30-20-12.eu-west-1.compute.internal", ... }
  { "serverIp": "ip-172-82-121-1.eu-west-2.compute.internal", ... }
  { "serverIp": "ip-172-99-72-187.us-east-1.compute.internal", ... }
  ...

  # Query 1 - Redact all parts containing the string '.computer.internal'
  source logs
  | redact serverIp matching 'compute.internal' to ''

  # Results 1
  { "serverIp": "ip-172-30-20-12.eu-west-1", ... }
  { "serverIp": "ip-172-82-121-1.eu-west-2", ... }
  { "serverIp": "ip-172-99-72-187.us-east-1", ... }

  # Query 2 - Redact all digits before aggregation using regexp
  source logs
  | redact serverIp matching /[0-9]+/ to 'X'
  | countby serverIp

  # Results 2
  { "serverIp": "ip-X-X-X-X.eu-west-X.compute.internal", "_count": 2323 }
  { "serverIp": "ip-X-X-X-X.us-east-X.compute.internal", "_count": 827 }
  ...
  source

  Set the data source that your DataPrime query is based on.

  Syntax

  source <data_store>

  Where <data_store> can be either:

  logs
  spans (supported only in the API)
  The name of the custom enrichment. In this case, the command will display the custom enrichment table.

  Example

  source logs
  Additional Resources
  DataPrime Quick-Start Guide
  DataPrime Query Language
  Glossary: DataPrime Operators & Expressions
  --------------------------------------------------
    `;

  const totalPrompt = `
    ${prompt}

    Given the following Coralogix log fields:
    ${commonFields}
     
    Can you please generate a DataPrime query that
    fetches all the logs with a log message "User could not pay"?

    Return your answer as:
    Query: "your query"
    `;
  const output = await chatModel.invoke(totalPrompt);
  console.log(output);
})();
