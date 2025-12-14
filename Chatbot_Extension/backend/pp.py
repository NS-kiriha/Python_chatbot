# Hardcoded Sudoku grid
sud = [
    [2, 9, 5, 7, 4, 3, 8, 6, 1],
    [4, 3, 1, 8, 6, 5, 9, 2, 7],
    [8, 7, 6, 1, 9, 2, 5, 4, 3],
    [3, 8, 7, 4, 5, 9, 2, 1, 6],
    [6, 1, 2, 3, 8, 7, 4, 9, 5],
    [5, 4, 9, 2, 1, 6, 7, 3, 8],
    [7, 6, 3, 5, 2, 4, 1, 8, 9],
    [9, 2, 8, 6, 7, 1, 3, 5, 4],
    [1, 5, 4, 9, 3, 8, 6, 7, 2]
]

# Function to check columns
def check_columns(grid):
    for col in range(9):
        column = [grid[row][col] for row in range(9)]
        if set(column) != set(range(1, 10)):
            return False
    return True

# Function to check 3x3 boxes
def check_boxes(grid):
    for box_row in range(0, 9, 3):
        for box_col in range(0, 9, 3):
            box = []
            for i in range(3):
                for j in range(3):
                    box.append(grid[box_row + i][box_col + j])
            if set(box) != set(range(1, 10)):
                return False
    return True

# Validate rows, columns, boxes
rows_valid = all(set(row) == set(range(1, 10)) for row in sud)
columns_valid = check_columns(sud)
boxes_valid = check_boxes(sud)

# Final result
if rows_valid and columns_valid and boxes_valid:
    print("✅ Sudoku is VALID!")
else:
    print("❌ Sudoku is INVALID!")
