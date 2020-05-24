var Config = {
    StandardTestParameter: {
        InfillType:{
            Options: ["Rectilinear", "Grid", "Triangles", "Stars", "Cubic", "Line", "Concentric", "Honeycomb", "3d Honeycomb", "Gyroid", "Hilbert Curve", "Archimedean Chords", "Octagram Spiral"],
            Default: "Gyroid"
        },

        MaterialType:{
            Options: ["PLA", "PETG", "PET", "ABS", "TPU", "PC", "NYLON", "ASA"],
            Default: "PLA"
        },

        Orientation:{
            Options: ["Standing", "Lying"],
            Default: "Lying"
        },

        TestModes:{
          Options: ["Slow Test (M10)", "Fast Test (M13)"]  
        },
        
        Parameter: [
            {Name: "Infill", Value: 15, Unit: "%"},
            {Name: "Layer Height", Value: 0.3, Unit: "mm"},
            {Name: "First Layer Height", Value: 0.3, Unit: "mm"},
            {Name: "Nozzle Size", Value: 0.5, Unit: "mm"},
            {Name: "Bed Temperatur", Value: 70, Unit: "°"},
            {Name: "Nozzle Temperatur", Value: 200, Unit: "°"},
            {Name: "Vertical Shells", Value: 3, Unit: ""},
            {Name: "Top Layers", Value: 3, Unit: ""},
            {Name: "Bottom Layers", Value: 3, Unit: ""}
        ]

    }
}