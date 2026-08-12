@group(0) @binding(0) var<storage, read> matrixA : array<f32>;
@group(0) @binding(1) var<storage, read> matrixB : array<f32>;
@group(0) @binding(2) var<storage, read_write> matrixC : array<f32>;

// Uniform block to pass dimensions: [rowsA, colsA_rowsB, colsB]
struct Dimensions {
  dimA: u32,
  dimB: u32,
  dimC: u32,
}
@group(0) @binding(3) var<uniform> dims : Dimensions;

@compute @workgroup_size(16, 16)
fn main(@builtin(global_invocation_id) global_id : vec3<u32>) {
    let row = global_id.y;
    let col = global_id.x;

    if (row >= dims.dimA || col >= dims.dimC) {
        return;
    }

    var sum = 0.0;
    for (var i = 0u; i < dims.dimB; i = i + 1u) {
        let aIndex = row * dims.dimB + i;
        let bIndex = i * dims.dimC + col;
        sum = sum + matrixA[aIndex] * matrixB[bIndex];
    }

    let cIndex = row * dims.dimC + col;
    matrixC[cIndex] = sum;
}
