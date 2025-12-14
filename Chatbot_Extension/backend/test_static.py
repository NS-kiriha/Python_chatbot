import os
from app import app

def test_static_files():
    print(f"Static folder: {app.static_folder}")
    print("\nFiles in static folder:")
    if os.path.exists(app.static_folder):
        for f in os.listdir(app.static_folder):
            if os.path.isfile(os.path.join(app.static_folder, f)):
                print(f"- {f}")
    else:
        print("Static folder not found")

if __name__ == "__main__":
    test_static_files()
