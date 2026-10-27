import { describe, expect, it } from "vitest";
import type { Product } from "@/types/product";
import { valitseLisatarra } from "./lisatarra";

const tuote = (o: Partial<Product>): Product =>
  ({
    id: o.slug,
    name: o.slug,
    images: [],
    variants: { sizes: ['3.5" × 3.5"'], colors: [], variant_map: { '|3.5" × 3.5"': 1 } },
    ...o,
  }) as unknown as Product;

const tarra = tuote({ slug: "se-oli-tonnin-seteli-tarra", category: "tarrat", price: 11.9 });
const paita = tuote({ slug: "tonnin-seteli-t-paita", category: "t-paidat", price: 24.9 });

describe("valitseLisatarra", () => {
  it("ehdottaa tarraa, kun korissa on muu tuote", () => {
    expect(valitseLisatarra([paita], [paita, tarra])?.slug).toBe("se-oli-tonnin-seteli-tarra");
  });
  it("ei ehdota tyhjään koriin eikä koriin, jossa on jo tarra", () => {
    expect(valitseLisatarra([], [paita, tarra])).toBeNull();
    expect(valitseLisatarra([paita, tarra], [paita, tarra])).toBeNull();
  });
  it("ei ehdota hupparikoriin (3,90 € / 60 € -säännöllä huppari + tarra on tappiollinen)", () => {
    const huppari = tuote({ slug: "tonnin-seteli-huppari", category: "hupparit", price: 49.9 });
    expect(valitseLisatarra([huppari], [huppari, tarra])).toBeNull();
    expect(valitseLisatarra([paita, huppari], [paita, huppari, tarra])).toBeNull();
  });
  it("ei ehdota, jos tarran hinta ei ole laskelman 11,90 € tai tarraa ei ole", () => {
    expect(valitseLisatarra([paita], [paita, { ...tarra, price: 9.9 }])).toBeNull();
    expect(valitseLisatarra([paita], [paita])).toBeNull();
  });
});
