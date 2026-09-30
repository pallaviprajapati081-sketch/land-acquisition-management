"""Synthetic, non-authoritative GIS geometry helpers."""
import math

def parcel_polygon(lat, lng, index):
    """Return a small plausible quadrilateral around a synthetic centroid."""
    size = 0.002 + (index % 7) * 0.00025
    skew = (index % 5) * 0.00015
    return [[round(lat-size, 6), round(lng-size, 6)], [round(lat-size+skew, 6), round(lng+size, 6)],
            [round(lat+size, 6), round(lng+size-skew, 6)], [round(lat+size-skew, 6), round(lng-size, 6)]]

def project_point(state, index):
    return round(state['lat'] + ((index % 5) - 2) * .32, 5), round(state['lng'] + ((index % 7) - 3) * .28, 5)
