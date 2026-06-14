import { describe, expect, it } from "bun:test"

import {
  buildTopPerformersData,
  createTopPerformersSWRConfig,
} from "./top-performers.helpers"

describe("top performers helpers", () => {
  it("buildTopPerformersData maps raw buckets into performer rows", () => {
    const data = buildTopPerformersData(
      [
        {
          id: 1,
          name: "Player One",
          country_code: "usa",
          image_url: null,
          classification: "F",
          rating: 8.1,
          goals: 4,
        },
      ],
      [
        {
          id: 2,
          name: "Player Two",
          country_code: null,
          image_url: undefined,
          classification: "M",
          rating: 7.5,
          assists: 3,
        },
      ],
      [
        {
          id: 3,
          name: "Player Three",
          country_code: "BRA",
          image_url: "https://example.com/image.png",
          classification: "G",
          rating: 6.9,
          clean_sheets: 5,
        },
      ],
      [
        {
          id: 4,
          name: "Player Four",
          country_code: "ARG",
          image_url: null,
          classification: "D",
          rating: 9.1,
        },
      ]
    )

    expect(data.goals[0]).toMatchObject({
      name: "Player One",
      initials: "PO",
      nationality: "usa",
      value: 4,
      rating: 8.1,
      group: "D",
      federation: "CONCACAF",
    })
    expect(data.assists[0]).toMatchObject({
      nationality: "",
      group: "A",
      federation: "UEFA",
      value: 3,
    })
    expect(data.saves[0]).toMatchObject({
      avatar: "https://example.com/image.png",
      value: 5,
    })
    expect(data.rating[0]).toMatchObject({
      value: 9.1,
      position: "DEF",
    })
  })

  it("createTopPerformersSWRConfig enables retries", () => {
    const config = createTopPerformersSWRConfig()

    expect(config.shouldRetryOnError).toBe(true)
    expect(config.errorRetryCount).toBe(3)
  })
})
