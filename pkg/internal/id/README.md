# id module

This module generates IDs in Snowflake format.

## About Pulsate Snowflake ID

Based on Twitter Snowflake, this is a 64-bit integer consisting of the following
bitfield (big-endian in the figure). Since it contains the time at the
beginning, it can be sorted directly by time.

```
111111111111111111111111111111111111111111 1111111111 111111111111
64                                         22         12          0
timestamp                                  worker id  incremental
```

The meaning of each bit field is as follows

| field       | bit range | meaning                                                                                                                                                        |
| ----------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| timestamp   | [64, 22)  | UNIX(milliseconds) from Epoch. Pulsate Epoch is 2022 Jan. 1 00:00:0.000UTC. Can be converted to this by adding 1640995200000 to the milliseconds of UNIX time. |
| worker id   | [22, 12)  | Identifier of the worker who generated this ID                                                                                                                 |
| incremental | [12, 0)   | Value that increases each time an ID is generated at the same time by the worker                                                                               |
